import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  MonitorPlay, Clock, CheckCircle2, Play, Loader2,
  ChevronLeft, BarChart2, X, Image, FileText, AlignLeft,
  ExternalLink, Eye, Film, Sparkles, BookOpen, GraduationCap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/api/axios';
import { accountAPI } from '@/api/services';
import PDFViewer from '@/components/PDFViewer';
import { toast } from 'sonner';

const YEAR_LABELS = {
  'first-prep':  'الصف الأول الإعدادي',
  'second-prep': 'الصف الثاني الإعدادي',
  'third-prep':  'الصف الثالث الإعدادي',
  'first-sec':   'الصف الأول الثانوي',
  'second-sec':  'الصف الثاني الثانوي',
  'third-sec':   'الصف الثالث الثانوي',
};

const COMPLETION_THRESHOLD = 80;
const HEARTBEAT_INTERVAL   = 15;

// ── Landscape-on-fullscreen helper ────────────────────────────────────────────
// عند دخول وضع ملء الشاشة (سواء بزرار المشغّل بتاع يوتيوب أو زرار الفيديو
// العادي)، نحاول نقفل الاتجاه أفقي (Landscape) على الموبايل. الـ Screen
// Orientation Lock API مدعوم بس على متصفحات Chromium على أندرويد وبيتطلب
// إننا نكون بالفعل جوه Fullscreen — لو المتصفح/الجهاز مش بيدعمها (زي سفاري
// على آيفون، اللي مبيدعمهاش خالص) بنكتفي بإن المستخدم يلف الموبايل يدويًا،
// من غير ما نكسر تشغيل الفيديو أو نظهر أي error للمستخدم.
function attachLandscapeOnFullscreen(containerEl) {
  if (!containerEl) return () => {};
  const tryLock = () => {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (fsEl && containerEl.contains(fsEl)) {
      try {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } catch { /* غير مدعوم — تجاهل بأمان */ }
    } else {
      try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch {}
    }
  };
  document.addEventListener('fullscreenchange', tryLock);
  document.addEventListener('webkitfullscreenchange', tryLock);
  return () => {
    document.removeEventListener('fullscreenchange', tryLock);
    document.removeEventListener('webkitfullscreenchange', tryLock);
  };
}

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [/youtu\.be\/([^?&#]+)/,/youtube\.com\/watch\?v=([^&#]+)/,/youtube\.com\/embed\/([^?&#]+)/,/youtube\.com\/shorts\/([^?&#]+)/];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEED_STEPS = [1, 1.25, 1.5, 2, 0.75];

// ── YouTube Player with tracking ──────────────────────────────────────────────
function YouTubePlayer({ videoUrl, lessonId, onProgress }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef  = useRef(null);
  const hideTimerRef = useRef(null);
  const watched   = useRef(0);
  const lastSent  = useRef(0);
  const plays     = useRef(0);
  const ytId      = extractYouTubeId(videoUrl);

  // ── حالة الـ Player المخصّص (Custom Controls) ─────────────────────────────
  const [ready,       setReady]       = useState(false);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [speedIdx,    setSpeedIdx]    = useState(0);
  const [isMuted,     setIsMuted]     = useState(false);
  const [showBar,     setShowBar]     = useState(true);
  const [seeking,     setSeeking]     = useState(false);
  const [seekPreview, setSeekPreview] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false); // BUGFIX: see note near the container below

  // ── إعدادات الـ Embed — كل ده متحقق منه فعليًا على مستندات يوتيوب الرسمية
  // (developers.google.com/youtube/player_parameters، آخر تحديث معتمد) ──────
  //
  // • controls=0: باراميتر رسمي موثّق بيخفي شريط تحكم يوتيوب بالكامل (تشغيل/
  //   إيقاف، الشريط الزمني، الصوت، وأي أزرار تانية فيه) من الأساس. بعد ما
  //   بنشيله، بنبني شريط تحكم بسيط خاص بينا (تشغيل/إيقاف، شريط زمني، سرعة،
  //   ملء الشاشة) باستخدام الـ IFrame Player API الرسمي (نفس الـ API اللي
  //   المشروع مستخدمه أصلًا لحساب وقت المشاهدة). ده مش hack — ده استخدام
  //   رسمي موثّق من يوتيوب نفسها ومذكور في أكتر من مصدر تقني معتمد كطريقة
  //   قياسية لعمل custom player.
  // • youtube-nocookie.com: نطاق يوتيوب الرسمي المخصص للخصوصية.
  // • rel=0: بعد تغيير رسمي من يوتيوب في سبتمبر 2018، الباراميتر ده بيحدد
  //   إن الفيديوهات المقترحة (لو ظهرت أصلًا) تكون من نفس القناة بس.
  // • iv_load_policy=3: بيمنع ظهور التعليقات التوضيحية.
  // • origin: باراميتر أمان رسمي موصى بيه من يوتيوب لما بنستخدم enablejsapi=1.
  // • playsinline=1: يمنع آيفون إنه يفتح الفيديو في مشغّل خارجي لوحده.
  //
  // ── حاجة لازم تتقال بصراحة ودي بتفضل ظاهرة حتى مع controls=0 ─────────────
  // من نفس المستند الرسمي (تغيير 23 أغسطس 2018): عنوان الفيديو + صورة القناة
  // (اللي هو رابط بيودّي لصفحة الفيديو على يوتيوب — ده الأقرب لـ"Watch on
  // YouTube") **هيفضل ظاهر في الزاوية العليا** قبل ما الطالب يشغّل الفيديو،
  // ووقت الإيقاف المؤقت، وبعد ما الفيديو يخلص. ده تثبيته يوتيوب نفسها ومفيش
  // parameter رسمي بيقفله خالص — **أثناء التشغيل الفعلي بس**، مع controls=0،
  // مفيش أي عنصر يوتيوب ظاهر خالص (لا Share ولا أي حاجة تانية).
  const embedUrl  = ytId ? `https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&controls=0&rel=0&iv_load_policy=3&color=white&playsinline=1&origin=${encodeURIComponent(window.location.origin)}` : null;

  const resetHideTimer = useCallback(() => {
    setShowBar(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsPlaying(playing => { if (playing) setShowBar(false); return playing; });
    }, 3000);
  }, []);

  useEffect(() => {
    if (!ytId) return;
    const init = () => {
      if (!window.YT || !iframeRef.current) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            setReady(true);
            setDuration(playerRef.current?.getDuration?.() || 0);
          },
          onStateChange: (e) => {
            const playing = e.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);
            if (playing) {
              resetHideTimer();
              plays.current++;
              timerRef.current = setInterval(() => {
                watched.current++;
                const total = playerRef.current?.getDuration?.() || 0;
                const cur   = playerRef.current?.getCurrentTime?.() || 0;
                setDuration(total);
                setCurrentTime(cur);
                const pct   = total > 0 ? Math.min(Math.round((watched.current/total)*100), 100) : 0;
                onProgress(watched.current, pct);
                if (watched.current - lastSent.current >= HEARTBEAT_INTERVAL) {
                  lastSent.current = watched.current;
                  api.post(`/lessons/${lessonId}/heartbeat`, { watchDuration:watched.current, watchPercentage:pct, playCount:plays.current }).catch(()=>{});
                  plays.current = 0;
                }
              }, 1000);
            } else {
              setShowBar(true);
              clearTimeout(hideTimerRef.current);
              clearInterval(timerRef.current);
              const total = playerRef.current?.getDuration?.() || 0;
              const pct   = total > 0 ? Math.min(Math.round((watched.current/total)*100), 100) : 0;
              api.post(`/lessons/${lessonId}/heartbeat`, { watchDuration:watched.current, watchPercentage:pct, playCount:plays.current }).catch(()=>{});
              plays.current = 0;
            }
          },
        },
      });
    };
    if (window.YT?.Player) init();
    else { window.onYouTubeIframeAPIReady = init; if (!document.getElementById('yt-api')) { const s=document.createElement('script'); s.id='yt-api'; s.src='https://www.youtube.com/iframe_api'; document.head.appendChild(s); } }
    return () => { clearInterval(timerRef.current); clearTimeout(hideTimerRef.current); playerRef.current?.destroy?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytId, lessonId]); // BUGFIX: intentionally excludes onProgress/resetHideTimer — the parent
  // passes a new `handleProgress` function reference on every render (it isn't
  // memoized), so including it here would destroy & recreate the YT.Player
  // instance (and restart playback) on every re-render. Referenced via
  // closure instead, exactly like the pre-existing progress-tracking code did.

  // تفعيل وضع Landscape تلقائيًا عند دخول ملء الشاشة على الموبايل (لو مدعوم)
  useEffect(() => attachLandscapeOnFullscreen(containerRef.current), []);

  // BUGFIX (controls missing / video looks zoomed inside Fullscreen):
  // الحاوية بتاعة الفيديو بتستخدم "padding-bottom: 56.25%" عشان تحافظ على
  // نسبة 16:9 في الوضع العادي — والنسبة دي بتتحسب دايمًا من عرض الحاوية.
  // في وضع الـ Fullscreen، عرض الحاوية بيبقى عرض الشاشة كامل، فلو ارتفاع
  // الشاشة الفعلي مختلف عن 56.25% من العرض (شبه كل الموبايلات كده)، جزء من
  // مساحة الشاشة (اللي المفروض فيها شريط التحكم بتاعنا) بيفضل برّه المساحة
  // اللي فعليًا بيتحسب عليها الفيديو — فيظهر إما جزء من الفيديو متكبّر
  // (crop) أو شريط التحكم مش في نفس مكان الفيديو الفعلي. الحل: لما نبقى في
  // Fullscreen فعلي، نخلي الحاوية تملأ الشاشة بالكامل (100% ارتفاع) بدل ما
  // تتحسب كنسبة من العرض، فالفيديو وشريط التحكم يفضلوا في نفس المساحة
  // بالظبط زي أي مشغل فيديو عادي وقت الـ Fullscreen.
  useEffect(() => {
    const onFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement
        || document.mozFullScreenElement || document.msFullscreenElement;
      setIsFullscreen(!!fsEl && containerRef.current?.contains(fsEl));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
      document.removeEventListener('MSFullscreenChange', onFsChange);
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [isPlaying]);

  const cycleSpeed = useCallback(() => {
    if (!playerRef.current) return;
    const next = (speedIdx + 1) % SPEED_STEPS.length;
    setSpeedIdx(next);
    playerRef.current.setPlaybackRate(SPEED_STEPS[next]);
    resetHideTimer();
  }, [speedIdx, resetHideTimer]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
    else { playerRef.current.mute(); setIsMuted(true); }
    resetHideTimer();
  }, [isMuted, resetHideTimer]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
    resetHideTimer();
  }, [resetHideTimer]);

  const handleSeekChange = (e) => setSeekPreview(Number(e.target.value));
  const handleSeekStart  = () => { setSeeking(true); resetHideTimer(); };
  const handleSeekCommit = (e) => {
    const target = Number(e.target.value);
    playerRef.current?.seekTo?.(target, true);
    setCurrentTime(target);
    setSeeking(false);
    resetHideTimer();
  };

  if (!embedUrl) return <p className="text-slate-500 text-center py-8">رابط الفيديو غير صحيح</p>;

  const displayTime = seeking ? seekPreview : currentTime;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-black group select-none ${isFullscreen ? 'h-full' : ''}`}
      style={isFullscreen ? undefined : {paddingBottom:'56.25%'}}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <iframe ref={iframeRef} src={embedUrl} width="100%" height="100%" className="absolute inset-0 w-full h-full pointer-events-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen title="درس"/>

      {/* طبقة شفافة لالتقاط لمسة/ضغطة الطالب — مفيش أي عنصر يوتيوب تحتها
          بيتغطى، لأن controls=0 أصلًا شايل كل عناصر التحكم من يوتيوب،
          فمفيش حاجة نخفيها؛ إحنا بس بنمسك الضغطة عشان نشغّل/نوقّف بالـ API
          الرسمي بدل ما نسيبها تروح لحاجة مش موجودة أصلًا. */}
      <button
        type="button"
        aria-label={isPlaying ? 'إيقاف' : 'تشغيل'}
        className="absolute inset-0 w-full h-full bg-transparent cursor-pointer z-10"
        onClick={() => { togglePlay(); resetHideTimer(); }}
      />

      {/* زرار تشغيل كبير في النص لما الفيديو واقف */}
      {ready && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-7 w-7 text-white ms-1" fill="white" />
          </div>
        </div>
      )}

      {/* شريط التحكم المخصّص بينا — بديل شريط يوتيوب اللي اتشال بـ controls=0 */}
      <div
        className={`absolute bottom-0 inset-x-0 px-3 sm:px-4 pb-2.5 pt-8 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 z-20 ${showBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={displayTime}
          onChange={handleSeekChange}
          onMouseDown={handleSeekStart}
          onTouchStart={handleSeekStart}
          onMouseUp={handleSeekCommit}
          onTouchEnd={handleSeekCommit}
          className="w-full h-1.5 mb-2 accent-orange-500 cursor-pointer"
          aria-label="الشريط الزمني"
        />
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2">
            <button type="button" onClick={togglePlay} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" aria-label={isPlaying ? 'إيقاف' : 'تشغيل'}>
              {isPlaying
                ? <span className="block w-4 h-4"><span className="flex gap-1"><span className="w-1.5 h-4 bg-white block rounded-sm"/><span className="w-1.5 h-4 bg-white block rounded-sm"/></span></span>
                : <Play className="h-4 w-4" fill="white" />}
            </button>
            <button type="button" onClick={toggleMute} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-xs font-semibold" aria-label="الصوت">
              {isMuted ? '🔇' : '🔊'}
            </button>
            <span className="text-[11px] tabular-nums text-white/90">{formatTime(displayTime)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cycleSpeed} className="px-2 py-1 hover:bg-white/10 rounded-lg transition-colors text-[11px] font-semibold" aria-label="سرعة التشغيل">
              {SPEED_STEPS[speedIdx]}×
            </button>
            <button type="button" onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" aria-label="ملء الشاشة">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Direct video player ───────────────────────────────────────────────────────
function DirectVideoPlayer({ videoUrl, lessonId, onProgress }) {
  const containerRef = useRef(null);
  const videoRef  = useRef(null);
  const watched   = useRef(0);
  const lastSent  = useRef(0);
  const interval  = useRef(null);

  const send = useCallback((pct) => {
    api.post(`/lessons/${lessonId}/heartbeat`, { watchDuration:Math.round(watched.current), watchPercentage:Math.round(pct), playCount:0 }).catch(()=>{});
  }, [lessonId]);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onPlay = () => {
      interval.current = setInterval(() => {
        watched.current++;
        const pct = v.duration > 0 ? (v.currentTime/v.duration)*100 : 0;
        onProgress(watched.current, Math.min(pct,100));
        if (watched.current - lastSent.current >= HEARTBEAT_INTERVAL) { lastSent.current=watched.current; send(pct); }
      }, 1000);
    };
    const onPause = () => { clearInterval(interval.current); const pct=v.duration>0?(v.currentTime/v.duration)*100:0; send(pct); };
    const onEnded = () => { clearInterval(interval.current); send(100); onProgress(watched.current,100); };
    v.addEventListener('play',onPlay); v.addEventListener('pause',onPause); v.addEventListener('ended',onEnded);
    return () => { clearInterval(interval.current); v.removeEventListener('play',onPlay); v.removeEventListener('pause',onPause); v.removeEventListener('ended',onEnded); };
  }, [lessonId, send]);

  // تفعيل وضع Landscape تلقائيًا عند دخول ملء الشاشة على الموبايل (لو مدعوم)
  useEffect(() => attachLandscapeOnFullscreen(containerRef.current), []);

  return (
    <div ref={containerRef}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        preload="metadata"
        // nodownload: يشيل زرار التحميل من شريط التحكم (لو المتصفح بيدعمه).
        // noremoteplayback: يشيل زرار الـ Cast (مشاركة على شاشة تانية).
        // disablePictureInPicture: يمنع فصل الفيديو في نافذة عائمة مستقلة.
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()} // يمنع "حفظ الفيديو باسم..." من كليك يمين
        onDragStart={(e) => e.preventDefault()}   // يمنع سحب الفيديو لسطح المكتب لحفظه
        className="w-full rounded-2xl bg-black shadow-lg border border-slate-200/80 dark:border-slate-800/80"
        style={{maxHeight:'460px'}}
      />
    </div>
  );
}

// ── PDF Viewer — opens inline inside platform ─────────────────────────────────
// ── PDF Viewer — fullscreen in-app viewer, NO download option ────────────────
// BUGFIX: previously rendered via a Google Docs Viewer iframe
// (docs.google.com/viewer?url=...), which is a third-party service that
// frequently fails to load PDFs from external hosts (Cloudinary URLs
// included) — this is the real cause of "PDF doesn't open" for students.
// Now uses the app's own PDFViewer (pdf.js canvas renderer) — no external
// dependency, no download option, works with Arabic file names since only
// the URL matters (the Arabic name is just a display label).
function PdfViewer({ url, name }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md shadow-sm cursor-pointer hover:shadow-md hover:border-orange-500/30 transition-all rounded-2xl group overflow-hidden" onClick={() => setOpen(true)}>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
              <FileText className="h-6 w-6 text-orange-500"/>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{name || 'ملف PDF'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">اضغط لقراءة الملف داخل المنصة</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2 shrink-0 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/20 dark:hover:text-orange-400 hover:border-orange-500/20 transition-all rounded-xl">
            <Eye className="h-4 w-4"/> فتح
          </Button>
        </CardContent>
      </Card>

      {/* Fullscreen in-app viewer modal */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-slate-950 flex flex-col antialiased">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md shrink-0">
            <p className="text-slate-100 font-bold text-sm sm:text-base truncate flex-1">{name || 'ملف PDF'}</p>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 shrink-0 rounded-xl transition-all" onClick={() => setOpen(false)}>
              <X className="h-5 w-5"/>
            </Button>
          </div>
          <div className="flex-1 bg-white relative">
            <PDFViewer url={url} />
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LESSON DETAIL — shows all items in order
// ══════════════════════════════════════════════════════════════════════════════
function LessonDetail({ lesson: initLesson, watchLog, onBack, onCompleted }) {
  const [lesson,   setLesson]   = useState(initLesson);
  const [loading,  setLoading]  = useState(!initLesson.items);
  const [watchPct, setWatchPct] = useState(watchLog?.watchPercentage || 0);
  const [completed,setCompleted]= useState(watchLog?.completed || false);

  useEffect(() => {
    // Get full lesson details
    api.get(`/student/lessons/${initLesson._id}`)
       .then(r => { setLesson(r.data.data.lesson || initLesson); setLoading(false); })
       .catch(() => { setLesson(initLesson); setLoading(false); });
  }, [initLesson._id]);

  const handleProgress = (duration, pct) => {
    setWatchPct(pct);
    if (pct >= COMPLETION_THRESHOLD && !completed) {
      setCompleted(true);
      onCompleted(initLesson._id);
    }
  };

  const sortedItems = [...(lesson.items || [])].sort((a,b) => a.order - b.order);

  // If old lesson with videoUrl but no items, show the video directly
  const hasLegacyVideo = !sortedItems.length && (lesson.videoUrl || initLesson.videoUrl);
  const legacyVideoUrl = lesson.videoUrl || initLesson.videoUrl;
  const isYT          = extractYouTubeId(legacyVideoUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col antialiased transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" className="shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all" onClick={onBack}>
          <ChevronLeft className="h-5 w-5 rtl:rotate-180 text-slate-700 dark:text-slate-300"/>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-slate-900 dark:text-white truncate text-sm sm:text-base leading-snug">{lesson.title}</h2>
          {completed && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5"/> مكتمل بنجاح
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Math Grid Accent in Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none z-0" />

        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8 pb-16 relative z-10">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500/40 opacity-75"></span>
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 relative z-10" />
              </div>
            </div>
          ) : hasLegacyVideo ? (
            /* Legacy single-video lesson */
            <div className="space-y-4">
              {isYT
                ? <YouTubePlayer videoUrl={legacyVideoUrl} lessonId={lesson._id} onProgress={handleProgress}/>
                : <DirectVideoPlayer videoUrl={legacyVideoUrl} lessonId={lesson._id} onProgress={handleProgress}/>}
              {watchPct > 0 && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${watchPct>=COMPLETION_THRESHOLD?'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]':'bg-indigo-600'}`} style={{width:`${watchPct}%`}}/>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">{Math.round(watchPct)}%</span>
                </div>
              )}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/30 dark:bg-slate-900/20 backdrop-blur-sm">
              <MonitorPlay className="h-12 w-12 text-slate-400 dark:text-slate-655 mx-auto mb-4 opacity-50"/>
              <p className="text-slate-500 dark:text-slate-400 font-semibold">لا يوجد محتوى في هذا الدرس بعد</p>
            </div>
          ) : (
            sortedItems.map((item, idx) => (
              <div key={item._id} className="space-y-4">
                {/* Video item */}
                {item.type === 'video' && (
                  <div className="space-y-3">
                    {extractYouTubeId(item.videoUrl)
                      ? <YouTubePlayer videoUrl={item.videoUrl} lessonId={lesson._id} onProgress={handleProgress}/>
                      : <DirectVideoPlayer videoUrl={item.videoUrl} lessonId={lesson._id} onProgress={handleProgress}/>}
                    
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {item.duration && (
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-indigo-500/80"/>
                          مدة المحاضرة: {item.duration}
                        </p>
                      )}
                      {watchPct > 0 && (
                        <div className="flex items-center gap-2.5 flex-1 max-w-[240px] sm:max-w-[300px]">
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${watchPct>=COMPLETION_THRESHOLD?'bg-emerald-500':'bg-indigo-600'}`} style={{width:`${watchPct}%`}}/>
                          </div>
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{Math.round(watchPct)}% مشاهدة</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image item */}
                {item.type === 'image' && (
                  <figure className="space-y-3 p-2 bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
                    <img src={item.imageUrl} alt={item.imageCaption||''} loading="lazy" className="w-full rounded-2xl border border-slate-100 dark:border-slate-850 object-contain bg-slate-950/5 dark:bg-slate-950/40 max-h-[500px]"/>
                    {item.imageCaption && (
                      <figcaption className="text-center text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 italic">
                        {item.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* PDF item — inline viewer */}
                {item.type === 'pdf' && (
                  <PdfViewer url={item.pdfUrl} name={item.pdfName}/>
                )}

                {/* Article item */}
                {item.type === 'article' && (
                  <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-indigo-500/60 rounded-full" />
                    {item.title && (
                      <h3 className="text-lg sm:text-xl font-extrabold pr-3 text-slate-900 dark:text-white leading-relaxed">{item.title}</h3>
                    )}
                    <div className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-medium">
                      {item.body}
                    </div>
                  </div>
                )}

                {/* Divider between items */}
                {idx < sortedItems.length - 1 && <hr className="border-slate-200 dark:border-slate-800/60 my-6"/>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function StudentOnlinePage() {
  const { user } = useAuth();
  const [lessons,  setLessons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [watching, setWatching] = useState(null); // { lesson, watchLog }
  // صورة المدرس تُستخدم كـ Poster تلقائي لأي فيديو مالوش صورة خاصة به
  const [teacherAvatar, setTeacherAvatar] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/student/lessons', { params:{ type:'video' } });
      setLessons(r.data.data.lessons || []);
    } catch { toast.error('فشل تحميل الدروس'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    accountAPI.teacherInfo().then(d => setTeacherAvatar(d?.teacher?.avatar || null)).catch(() => {});
  }, []);

  const handleCompleted = (lessonId) => {
    setLessons(prev => prev.map(l =>
      l._id === lessonId ? { ...l, watchLog: { ...(l.watchLog||{}), completed:true, watchPercentage:100 } } : l
    ));
  };

  const completedCount = lessons.filter(l => l.watchLog?.completed).length;

  if (watching) return (
    <LessonDetail
      lesson={watching.lesson}
      watchLog={watching.watchLog}
      onBack={() => { setWatching(null); load(); }}
      onCompleted={handleCompleted}
    />
  );

  return (
    <>
      <Helmet><title>أون لاين | منصة الطالب</title></Helmet>
      <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased font-sans overflow-hidden">
        
        {/* Coordinate vector background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none z-0" />
        
        <div className="relative p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 z-10">
          
          {/* Header Card */}
          <div className="relative overflow-hidden bg-gradient-to-l from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-600/15 dark:via-indigo-600/5 dark:to-transparent border border-slate-200/80 dark:border-indigo-500/20 rounded-3xl p-6 shadow-sm backdrop-blur-md group max-w-3xl mx-auto">
            
            {/* Background design graphics */}
            <svg className="absolute left-0 bottom-0 top-0 h-full w-1/4 opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0,0 C 50,50 50,100 100,100" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            </svg>

            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">الدروس الأون لاين</h2>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-500/15">
                  <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span>{YEAR_LABELS[user?.academicYear]||'منصة الإبداع'}</span>
                </div>
              </div>
              
              {!loading && lessons.length > 0 && (
                <div className="text-center bg-white/70 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-3 shadow-inner min-w-[90px]">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{completedCount}/{lessons.length}</p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">درس مكتمل</p>
                </div>
              )}
            </div>

            {!loading && lessons.length > 0 && (
              <div className="mt-5 space-y-1.5">
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" style={{width:`${(completedCount/lessons.length)*100}%`}}/>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500/40 opacity-75"></span>
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 relative z-10" />
              </div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="max-w-3xl mx-auto text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
              <MonitorPlay className="h-12 w-12 text-slate-400 dark:text-slate-650 mx-auto mb-4 opacity-50"/>
              <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد دروس متاحة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {lessons.map((lesson, idx) => {
                const log   = lesson.watchLog;
                const pct   = log?.watchPercentage || 0;
                const done  = log?.completed || false;
                const items = lesson.items || [];
                // Count content types
                const types = [...new Set(items.map(i=>i.type))];
                const typeIcons = { video:'📹 فيديو', image:'🖼 صورة', pdf:'📄 ملف', article:'📝 شرح' };

                // Poster: صورة الدرس المخصصة (thumbnailUrl) فقط — صورة المدرس بقت
                // عنصر Avatar منفصل وبارز جوه الكارد (مش خلفية) عشان تبان واضحة
                // وما تتقصش بشكل سيء زي ما كانت بتحصل قبل كده كـ cover كامل
                const posterSrc = lesson.thumbnailUrl || null;

                return (
                  <Card
                    key={lesson._id}
                    className={`group relative border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1.5 hover:border-indigo-300 dark:hover:border-indigo-500/40 active:scale-[0.99] rounded-[28px] overflow-hidden ${done?'ring-2 ring-emerald-400/60 dark:ring-emerald-500/40':''}`}
                    onClick={() => setWatching({ lesson, watchLog: log })}
                  >
                    <CardContent className="p-0">
                      {/* Poster / Thumbnail — نظيفة تمامًا، بدون نص مزدحم فوقها، عشان
                          تبان احترافية زي منصات الفيديو الكبيرة */}
                      <div className="relative w-full aspect-video bg-slate-900 overflow-hidden">
                        {posterSrc ? (
                          <img
                            src={posterSrc}
                            alt={lesson.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.55),transparent_55%)]"/>
                            <Film className="h-10 w-10 text-white/20 relative z-10"/>
                          </div>
                        )}

                        {/* Vignette سينمائي خفيف على الأطراف — بيدي عمق واحترافية بصرية */}
                        <div className="absolute inset-0 pointer-events-none" style={{boxShadow:'inset 0 0 50px 6px rgba(0,0,0,0.35)'}}/>
                        {/* تظليل خفيف بس فوق وتحت الصورة — لإبراز الشارات وزر التشغيل بس،
                            مش لحمل نص كامل زي قبل كده */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20 pointer-events-none"/>

                        {/* شريط علوي: رقم الدرس + شارة الحالة */}
                        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-black/55 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-sm">
                            {idx+1}
                          </span>
                          {done ? (
                            <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold shadow-sm backdrop-blur-md">✓ مكتمل</Badge>
                          ) : pct > 0 ? (
                            <Badge className="bg-indigo-600 text-white border-0 text-[10px] font-bold shadow-sm backdrop-blur-md">{Math.round(pct)}%</Badge>
                          ) : null}
                        </div>

                        {/* زر التشغيل المركزي */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_8px_28px_rgba(0,0,0,0.45)] backdrop-blur-md ring-1 ring-white/50 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_10px_36px_rgba(79,70,229,0.5)] ${done?'bg-emerald-500':'bg-white'}`}>
                            {done
                              ? <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-white"/>
                              : <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-indigo-600 text-indigo-600 mr-[-2px]"/>}
                          </div>
                        </div>

                        {/* شريط تقدّم المشاهدة — مدمج أسفل الصورة زي منصات الفيديو الكبيرة
                            (نفس فكرة يوتيوب): مش بار عادي فوق الكارت، لكنه Scrubber
                            حقيقي حاسس إنه جزء من الفيديو نفسه. بيظهر بس لو فيه تقدّم فعلي. */}
                        {(pct > 0 || done) && (
                          <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/25">
                            <div
                              className={`h-full transition-all duration-300 ${done?'bg-emerald-400':'bg-indigo-400'}`}
                              style={{width: done ? '100%' : `${pct}%`}}
                            />
                          </div>
                        )}
                      </div>

                      {/* منطقة المحتوى — صورة المدرس بقت Avatar كبير جدًا وبارز، طالع من فوق
                          حافة الصورة على سطح الكارت الفاتح، والعنوان بقى نص عادي على خلفية
                          الكارت (مش فوق صورة) عشان يكون أوضح خط ممكن وأعلى تباين ممكن. */}
                      <div className="relative px-4 sm:px-5 pt-14 sm:pt-16 pb-4 sm:pb-5">
                        {/* Avatar المدرس — كبير جدًا وبارز، بهالة لونية ناعمة وطالع فوق
                            حافة الصورة، بحدود بيضاء واضحة تفصله بأناقة */}
                        {teacherAvatar && (
                          <div className="absolute -top-11 sm:-top-14 right-4 sm:right-5 z-10">
                            <div className="relative">
                              <div className="absolute -inset-2 rounded-full bg-indigo-400/25 dark:bg-indigo-500/25 blur-lg -z-10 transition-opacity duration-300 group-hover:opacity-80"/>
                              <img
                                src={teacherAvatar}
                                alt="المدرس"
                                loading="lazy"
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-[5px] ring-white dark:ring-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.3)] transition-transform duration-300 group-hover:scale-[1.04]"
                              />
                              <span className="absolute -bottom-1 -left-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 ring-[3px] ring-white dark:ring-slate-900 flex items-center justify-center shadow-sm">
                                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white"/>
                              </span>
                            </div>
                          </div>
                        )}

                        {(lesson.unit || lesson.branch) && (
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold tracking-wide text-indigo-600 dark:text-indigo-400 mb-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0"/>
                            <span className="truncate">
                              {lesson.unit}
                              {lesson.unit && lesson.branch && <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>}
                              {lesson.branch}
                            </span>
                          </div>
                        )}

                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg leading-[1.4] tracking-tight line-clamp-2">
                          {lesson.title}
                        </h3>

                        {lesson.description && (
                          <p className="text-xs sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mt-1.5">
                            {lesson.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-3 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="min-w-0 flex-1">
                            {types.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {types.map(t => (
                                  <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200/50 dark:border-slate-750/30">
                                    {typeIcons[t] || t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                            <span className="hidden sm:inline opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                              {done ? 'مشاهدة مرة أخرى' : pct>0 ? 'استكمال المشاهدة' : 'شاهد الآن'}
                            </span>
                            <ChevronLeft className="h-5 w-5 text-slate-400 dark:text-slate-650 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 group-hover:translate-x-[-2px] transition-all duration-300"/>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}