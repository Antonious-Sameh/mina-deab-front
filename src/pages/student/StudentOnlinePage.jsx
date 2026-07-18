import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  MonitorPlay, Clock, CheckCircle2, Play, Loader2,
  ChevronLeft, BarChart2, X, Image, FileText, AlignLeft,
  ExternalLink, Eye, Film, Sparkles, BookOpen
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/api/axios';
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

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [/youtu\.be\/([^?&#]+)/,/youtube\.com\/watch\?v=([^&#]+)/,/youtube\.com\/embed\/([^?&#]+)/,/youtube\.com\/shorts\/([^?&#]+)/];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

// ── YouTube Player with tracking ──────────────────────────────────────────────
function YouTubePlayer({ videoUrl, lessonId, onProgress }) {
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef  = useRef(null);
  const watched   = useRef(0);
  const lastSent  = useRef(0);
  const plays     = useRef(0);
  const ytId      = extractYouTubeId(videoUrl);
  const embedUrl  = ytId ? `https://www.youtube.com/embed/${ytId}?enablejsapi=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&color=white&playsinline=1` : null;

  useEffect(() => {
    if (!ytId) return;
    const init = () => {
      if (!window.YT || !iframeRef.current) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              plays.current++;
              timerRef.current = setInterval(() => {
                watched.current++;
                const total = playerRef.current?.getDuration?.() || 0;
                const pct   = total > 0 ? Math.min(Math.round((watched.current/total)*100), 100) : 0;
                onProgress(watched.current, pct);
                if (watched.current - lastSent.current >= HEARTBEAT_INTERVAL) {
                  lastSent.current = watched.current;
                  api.post(`/lessons/${lessonId}/heartbeat`, { watchDuration:watched.current, watchPercentage:pct, playCount:plays.current }).catch(()=>{});
                  plays.current = 0;
                }
              }, 1000);
            } else {
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
    return () => { clearInterval(timerRef.current); playerRef.current?.destroy?.(); };
  }, [ytId, lessonId]);

  if (!embedUrl) return <p className="text-slate-500 text-center py-8">رابط الفيديو غير صحيح</p>;
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-black group" style={{paddingBottom:'56.25%'}}>
      <iframe ref={iframeRef} src={embedUrl} className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen title="درس"/>
    </div>
  );
}

// ── Direct video player ───────────────────────────────────────────────────────
function DirectVideoPlayer({ videoUrl, lessonId, onProgress }) {
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

  return <video ref={videoRef} src={videoUrl} controls controlsList="nodownload" className="w-full rounded-2xl bg-black shadow-lg border border-slate-200/80 dark:border-slate-800/80" style={{maxHeight:'460px'}}/>;
}

// ── PDF Viewer — opens inline inside platform ─────────────────────────────────
// ── PDF Viewer — fullscreen in-app viewer, NO download option ────────────────
function PdfViewer({ url, name }) {
  const [open, setOpen] = useState(false);

  // Google Docs Viewer يعرض الملف كـ preview موثق يشتغل على الموبايل والكمبيوتر
  // وبشكل أساسي يمنع تحميل الملف مباشرة لحماية محتواك
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

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
            {/* Ambient loading indicator behind iframe */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0 relative z-10"
              title={name || 'PDF'}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
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
                    <img src={item.imageUrl} alt={item.imageCaption||''} className="w-full rounded-2xl border border-slate-100 dark:border-slate-850 object-contain bg-slate-950/5 dark:bg-slate-950/40 max-h-[500px]"/>
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

  const load = useCallback(async () => {
    try {
      const r = await api.get('/student/lessons', { params:{ type:'video' } });
      setLessons(r.data.data.lessons || []);
    } catch { toast.error('فشل تحميل الدروس'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

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
        
        <div className="relative p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 z-10">
          
          {/* Header Card */}
          <div className="relative overflow-hidden bg-gradient-to-l from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-600/15 dark:via-indigo-600/5 dark:to-transparent border border-slate-200/80 dark:border-indigo-500/20 rounded-3xl p-6 shadow-sm backdrop-blur-md group">
            
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
            <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
              <MonitorPlay className="h-12 w-12 text-slate-400 dark:text-slate-650 mx-auto mb-4 opacity-50"/>
              <p className="text-slate-500 dark:text-slate-400 font-bold">لا توجد دروس متاحة حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson, idx) => {
                const log   = lesson.watchLog;
                const pct   = log?.watchPercentage || 0;
                const done  = log?.completed || false;
                const items = lesson.items || [];
                // Count content types
                const types = [...new Set(items.map(i=>i.type))];
                const typeIcons = { video:'📹 فيديو', image:'🖼 صورة', pdf:'📄 ملف', article:'📝 شرح' };

                return (
                  <Card
                    key={lesson._id}
                    className={`border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-indigo-500/30 dark:hover:border-indigo-500/30 active:scale-[0.99] relative group ${done?'border-emerald-300/60 dark:border-emerald-950':''}`}
                    onClick={() => setWatching({ lesson, watchLog: log })}
                  >
                    <CardContent className="p-0">
                      {/* Watch progression indicator line */}
                      <div className={`h-1 transition-all duration-300 ${done?'bg-emerald-500':pct>0?'bg-indigo-600':'bg-slate-200 dark:bg-slate-800'}`} style={{width:done?'100%':`${pct}%`}}/>
                      
                      <div className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Play/Complete State Icon */}
                          <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-105 ${done?'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20':'bg-indigo-50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 border-indigo-100/50 dark:border-indigo-900/10'}`}>
                            {done
                              ? <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400"/>
                              : <Play className={`h-5 w-5 fill-current ${pct>0?'text-indigo-600 dark:text-indigo-400':'text-slate-400 dark:text-slate-500'}`}/>}
                          </div>
                          
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{idx+1}.</span>
                              <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-snug">{lesson.title}</p>
                              {done && <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-0 text-[10px] font-bold">✓ مكتمل</Badge>}
                            </div>
                            
                            <div className="flex items-center gap-x-2.5 gap-y-1 mt-1.5 flex-wrap">
                              {lesson.description && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{lesson.description}</span>}
                              
                              {/* Separator dot */}
                              {lesson.description && types.length > 0 && <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700" />}

                              {types.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {types.map(t => (
                                    <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200/50 dark:border-slate-750/30">
                                      {typeIcons[t] || t}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {pct > 0 && !done && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700" />
                                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{Math.round(pct)}% مشاهدة</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronLeft className="h-5 w-5 text-slate-400 dark:text-slate-650 shrink-0 group-hover:translate-x-[-2px] transition-transform duration-300"/>
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