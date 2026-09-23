import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  MonitorPlay, Clock, CheckCircle2, Play, Loader2,
  ChevronLeft, BarChart2, X, Image, FileText, AlignLeft,
  ExternalLink, Eye, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/api/axios';
import { accountAPI } from '@/api/services';
import PDFViewer from '@/components/PDFViewer';
import DownloadAppBanner from '@/components/DownloadAppBanner';
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
          <h2 className="font-display font-black text-slate-900 dark:text-white truncate text-base sm:text-lg tracking-tight leading-snug">{lesson.title}</h2>
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
// LESSON POSTER — تصميم مخصص بالكامل (بديل الصورة الممطوطة القديمة)
// ══════════════════════════════════════════════════════════════════════════════

// باقة تدرجات مختارة يدويًا (مش عشوائية) — كل واحدة متناسقة مع هوية الألوان
// المستخدمة في باقي الصفحة (indigo/emerald/amber) لكن بعمق ودراما أكتر،
// مخصصة للدروس اللي معهاش صورة غلاف مرفوعة.
const LESSON_THEMES = [
  { from: '#1e1b4b', via: '#4338ca', to: '#7c3aed', glow: 'rgba(99,102,241,0.55)'  }, // Indigo Nova
  { from: '#431407', via: '#c2410c', to: '#f59e0b', glow: 'rgba(245,158,11,0.5)'  }, // Ember
  { from: '#022c22', via: '#047857', to: '#10b981', glow: 'rgba(16,185,129,0.5)' }, // Emerald Deep
  { from: '#4c0519', via: '#be123c', to: '#fb7185', glow: 'rgba(251,113,133,0.5)' }, // Rose Quartz
  { from: '#0c1e2e', via: '#0e7490', to: '#22d3ee', glow: 'rgba(34,211,238,0.5)'  }, // Midnight Teal
];

// اختيار ثابت (deterministic) للتدرج حسب هوية الدرس — نفس الدرس دايمًا ياخد
// نفس اللون، من غير ما يتغيّر عشوائيًا مع كل reload.
function themeFor(seed) {
  const s = String(seed || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return LESSON_THEMES[h % LESSON_THEMES.length];
}

// زخرفة رياضية خفيفة جدًا (رموز + خطوط إنشائية) — بديل واضح ونظيف محل
// الصورة الشخصية الممطوطة القديمة، بتدّي هوية "منصة رياضيات" بصريًا حتى
// من غير أي صورة مرفوعة.
function MathMotif() {
  return (
    <svg className="absolute inset-0 w-full h-full text-white" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.16" />
        </pattern>
      </defs>
      <rect width="400" height="225" fill="url(#grid)" />
      <path d="M -20,170 C 90,120 130,210 260,140 S 380,60 430,90" stroke="currentColor" strokeWidth="1.25" fill="none" opacity="0.22" />
      <path d="M -20,40 C 70,90 110,10 220,55" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="3 5" opacity="0.18" />
      <text x="26" y="76"  fontSize="42" fontWeight="700" fill="currentColor" opacity="0.14">√</text>
      <text x="330" y="52" fontSize="34" fontWeight="700" fill="currentColor" opacity="0.16" transform="rotate(-8 330 52)">π</text>
      <text x="300" y="175" fontSize="46" fontWeight="700" fill="currentColor" opacity="0.13" transform="rotate(6 300 175)">∑</text>
      <text x="55" y="185" fontSize="30" fontWeight="700" fill="currentColor" opacity="0.15">∞</text>
      <text x="180" y="120" fontSize="26" fontWeight="700" fill="currentColor" opacity="0.10" transform="rotate(-10 180 120)">x²</text>
    </svg>
  );
}

// كارت الدرس بالكامل — تصميم "Split" جديد كليًا: الصورة في شريط جانبي ثابت
// العرض، والكتابة (العنوان/الوحدة/التقدّم/الزرار) في لوحة منفصلة تمامًا
// جنبها، مش فوق الصورة خالص. ده تغيير في التركيبة نفسها مش بس الألوان —
// محدش من البيانات أو الوظائف (onClick، تتبع المشاهدة، الحالة) اتلمس.
function LessonPhoto({ lesson, idx, teacherAvatar }) {
  const isAvatarFallback = !lesson.thumbnailUrl && !!teacherAvatar;
  const posterSrc = lesson.thumbnailUrl || teacherAvatar || null;
  const theme = themeFor(lesson._id || lesson.title || idx);

  return (
    <div className="relative w-24 sm:w-36 md:w-44 lg:w-52 xl:w-60 shrink-0 self-stretch overflow-hidden">
      {posterSrc ? (
        <>
          <img
            src={posterSrc}
            alt={lesson.title}
            loading="lazy"
            // صورة المدرس (بورتريه) محتاجة تأطير مختلف عن صورة غلاف عادية —
            // object-top عشان الوش ميتقصّش من فوق، وبدون درجة لون فوقها
            // (المفروض تفضل طبيعية وواضحة).
            className={`w-full h-full object-cover [filter:saturate(1.08)_contrast(1.08)_brightness(1.03)] ${isAvatarFallback ? 'object-top' : 'object-center'}`}
          />
          {!isAvatarFallback && (
            <div
              className="absolute inset-0 mix-blend-overlay opacity-40"
              style={{ background: `linear-gradient(160deg, ${theme.from}, transparent 55%, ${theme.to})` }}
            />
          )}
        </>
      ) : (
        <div className="relative w-full h-full" style={{ background: `linear-gradient(165deg, ${theme.from}, ${theme.via} 55%, ${theme.to})` }}>
          <MathMotif />
        </div>
      )}
      {/* حافة تدرّج رفيعة عند الحد الفاصل مع لوحة الكتابة — انتقال بصري ناعم
          بدل قطع مفاجئ بين الصورة والخلفية */}
      <div className="absolute inset-y-0 start-0 w-6 sm:w-10 bg-gradient-to-l rtl:bg-gradient-to-r from-transparent to-black/10 dark:to-black/25 pointer-events-none" />
    </div>
  );
}

// اللوحة الجانبية اللي فيها كل الكتابة — منفصلة تمامًا عن الصورة، خلفيتها
// عادية (مش فوق أي صورة)، فالنص واضح 100% في كل الحالات.
function LessonInfo({ lesson, idx, done, pct, theme }) {
  const hasProgress = pct > 0 && !done;
  return (
    <div className="relative flex-1 min-w-0 flex flex-col justify-center gap-2.5 p-4 sm:p-5 md:p-6 lg:p-7">
      {/* رقم الدرس الضخم — عنصر بصري بارز يعبر الحد بين الصورة واللوحة،
          ودوره فعليًا إفادة (ترتيب الدرس)، مش مجرد ديكور */}
      <span
        className="pointer-events-none select-none absolute top-1/2 z-0 font-display font-black leading-none start-24 sm:start-36 md:start-44 lg:start-52 xl:start-60 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2"
        style={{ fontSize: 'clamp(2.5rem, 5vw, 5.5rem)', color: theme.to, opacity: 0.16 }}
        aria-hidden="true"
      >
        {String(idx + 1).padStart(2, '0')}
      </span>

      <div className="relative z-10 space-y-2 sm:space-y-2.5">
        {(lesson.branch || lesson.unit) && (
          <div className="flex items-center gap-1.5 font-display text-xs sm:text-sm font-bold" style={{ color: theme.to }}>
            {lesson.branch && <span>{lesson.branch}</span>}
            {lesson.branch && lesson.unit && <span className="opacity-30">•</span>}
            {lesson.unit && <span>{lesson.unit}</span>}
          </div>
        )}

        <p className="font-display font-black text-slate-900 dark:text-white text-lg sm:text-xl md:text-2xl leading-tight tracking-tight line-clamp-2">
          {lesson.title}
        </p>

        {lesson.description && (
          <p className="hidden sm:block text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1 md:line-clamp-2">
            {lesson.description}
          </p>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-between gap-3 pt-1 sm:pt-2">
        {done ? (
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> مكتمل
          </span>
        ) : hasProgress ? (
          <div className="flex items-center gap-2 flex-1 max-w-[9rem] sm:max-w-[11rem]">
            <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 tabular-nums shrink-0">{Math.round(pct)}%</span>
          </div>
        ) : <span />}

        <span
          className="inline-flex items-center gap-1 text-sm sm:text-base font-extrabold shrink-0 group-hover:gap-1.5 transition-all"
          style={{ color: theme.to }}
        >
          {done ? 'إعادة المشاهدة' : hasProgress ? 'استكمال' : 'ابدأ المشاهدة'}
          <ChevronLeft className="h-4 w-4" />
        </span>
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
  // صورة المدرس تُستخدم كـ Poster تلقائي لأي فيديو مالوش صورة غلاف خاصة به
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

          <DownloadAppBanner />

          {/* Header Card */}
          <div className="relative overflow-hidden bg-gradient-to-l from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-600/15 dark:via-indigo-600/5 dark:to-transparent border border-slate-200/80 dark:border-indigo-500/20 rounded-3xl p-6 shadow-sm backdrop-blur-md group max-w-3xl mx-auto">
            
            {/* Background design graphics */}
            <svg className="absolute left-0 bottom-0 top-0 h-full w-1/4 opacity-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 0,0 C 50,50 50,100 100,100" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            </svg>

            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight">الدروس الأون لاين</h2>
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              {lessons.map((lesson, idx) => {
                const log   = lesson.watchLog;
                const pct   = log?.watchPercentage || 0;
                const done  = log?.completed || false;
                const theme = themeFor(lesson._id || lesson.title || idx);

                return (
                  <Card
                    key={lesson._id}
                    className={`group relative flex min-h-[132px] sm:min-h-[168px] md:min-h-[188px] lg:min-h-[208px] xl:min-h-[224px] border-0 bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[1.75rem] lg:rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 ease-out shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_-12px_rgba(15,23,42,0.12)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_24px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_18px_36px_-16px_rgba(79,70,229,0.3)] dark:hover:shadow-[0_18px_36px_-16px_rgba(99,102,241,0.35)] hover:-translate-y-1 active:scale-[0.99] ${done ? 'ring-2 ring-emerald-400/60 dark:ring-emerald-500/40' : 'ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06]'}`}
                    onClick={() => setWatching({ lesson, watchLog: log })}
                  >
                    <CardContent className="p-0 flex w-full">
                      <LessonPhoto lesson={lesson} idx={idx} teacherAvatar={teacherAvatar} />
                      <LessonInfo lesson={lesson} idx={idx} done={done} pct={pct} theme={theme} />
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