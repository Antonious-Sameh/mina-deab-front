import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  MonitorPlay, Clock, CheckCircle2, Play, Loader2,
  ChevronLeft, BarChart2, X, Image, FileText, AlignLeft,
  ExternalLink, Eye
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

  if (!embedUrl) return <p className="text-white/60 text-center py-8">رابط الفيديو غير صحيح</p>;
  return (
    <div className="relative w-full" style={{paddingBottom:'56.25%'}}>
      <iframe ref={iframeRef} src={embedUrl} className="absolute inset-0 w-full h-full rounded-xl"
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

  return <video ref={videoRef} src={videoUrl} controls controlsList="nodownload" className="w-full rounded-xl bg-black" style={{maxHeight:'400px'}}/>;
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
      <Card className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setOpen(true)}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-orange-500"/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold">{name || 'ملف PDF'}</p>
            <p className="text-xs text-muted-foreground">اضغط لقراءة الملف داخل المنصة</p>
          </div>
          <Button className="gap-2 shrink-0">
            <Eye className="h-4 w-4"/> فتح
          </Button>
        </CardContent>
      </Card>

      {/* Fullscreen in-app viewer modal */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
            <p className="text-white font-semibold text-sm truncate flex-1">{name || 'ملف PDF'}</p>
            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10 shrink-0" onClick={() => setOpen(false)}>
              <X className="h-5 w-5"/>
            </Button>
          </div>
          <div className="flex-1 bg-white">
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
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
  const containerRef = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    // Load full lesson with items
    api.get(`/lessons/${initLesson._id}/stream`)
       .catch(() => {})
       .finally(() => {});
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-4 sm:px-6 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onBack}>
          <ChevronLeft className="h-5 w-5"/>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold truncate text-sm sm:text-base">{lesson.title}</h2>
          {completed && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> مكتمل</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-10">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
          ) : hasLegacyVideo ? (
            /* Legacy single-video lesson */
            <div>
              {isYT
                ? <YouTubePlayer videoUrl={legacyVideoUrl} lessonId={lesson._id} onProgress={handleProgress}/>
                : <DirectVideoPlayer videoUrl={legacyVideoUrl} lessonId={lesson._id} onProgress={handleProgress}/>}
              {watchPct > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-1.5 rounded-full ${watchPct>=COMPLETION_THRESHOLD?'bg-green-500':'bg-primary'}`} style={{width:`${watchPct}%`}}/>
                  </div>
                  <span className="text-xs text-muted-foreground">{Math.round(watchPct)}%</span>
                </div>
              )}
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-2xl">
              <MonitorPlay className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30"/>
              <p className="text-muted-foreground">لا يوجد محتوى في هذا الدرس بعد</p>
            </div>
          ) : (
            sortedItems.map((item, idx) => (
              <div key={item._id} className="space-y-3">
                {/* Video item */}
                {item.type === 'video' && (
                  <div className="space-y-2">
                    {extractYouTubeId(item.videoUrl)
                      ? <YouTubePlayer videoUrl={item.videoUrl} lessonId={lesson._id} onProgress={handleProgress}/>
                      : <DirectVideoPlayer videoUrl={item.videoUrl} lessonId={lesson._id} onProgress={handleProgress}/>}
                    {item.duration && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/>{item.duration}</p>}
                    {watchPct > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div className={`h-1 rounded-full ${watchPct>=COMPLETION_THRESHOLD?'bg-green-500':'bg-primary'}`} style={{width:`${watchPct}%`}}/>
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round(watchPct)}% مشاهدة</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Image item */}
                {item.type === 'image' && (
                  <figure className="space-y-2">
                    <img src={item.imageUrl} alt={item.imageCaption||''} className="w-full rounded-2xl border object-contain bg-muted max-h-96"/>
                    {item.imageCaption && <figcaption className="text-center text-sm text-muted-foreground italic">{item.imageCaption}</figcaption>}
                  </figure>
                )}

                {/* PDF item — inline viewer */}
                {item.type === 'pdf' && (
                  <PdfViewer url={item.pdfUrl} name={item.pdfName}/>
                )}

                {/* Article item */}
                {item.type === 'article' && (
                  <div className="bg-card border rounded-2xl p-5 sm:p-6 space-y-3">
                    {item.title && (
                      <h3 className="text-lg font-extrabold border-r-4 border-primary pr-3">{item.title}</h3>
                    )}
                    <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {item.body}
                    </div>
                  </div>
                )}

                {/* Divider between items */}
                {idx < sortedItems.length - 1 && <hr className="border-border/50"/>}
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
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">الدروس الأون لاين</h2>
              <p className="text-muted-foreground text-sm mt-0.5">{YEAR_LABELS[user?.academicYear]||''}</p>
            </div>
            {!loading && lessons.length > 0 && (
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{completedCount}/{lessons.length}</p>
                <p className="text-xs text-muted-foreground">درس مكتمل</p>
              </div>
            )}
          </div>
          {!loading && lessons.length > 0 && (
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-2 bg-green-500 rounded-full transition-all" style={{width:`${(completedCount/lessons.length)*100}%`}}/>
            </div>
          )}
        </div>

        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
        : lessons.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
            <MonitorPlay className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30"/>
            <p className="text-muted-foreground font-medium">لا توجد دروس متاحة حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, idx) => {
              const log   = lesson.watchLog;
              const pct   = log?.watchPercentage || 0;
              const done  = log?.completed || false;
              const items = lesson.items || [];
              // Count content types
              const types = [...new Set(items.map(i=>i.type))];
              const typeIcons = { video:'📹', image:'🖼', pdf:'📄', article:'📝' };

              return (
                <Card
                  key={lesson._id}
                  className={`border shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${done?'border-green-300/60':''}`}
                  onClick={() => setWatching({ lesson, watchLog: log })}
                >
                  <CardContent className="p-0">
                    <div className={`h-1 ${done?'bg-green-500':pct>0?'bg-primary/60':'bg-muted'}`} style={{width:done?'100%':`${pct}%`}}/>
                    <div className="p-4 flex items-center gap-4">
                      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${done?'bg-green-100':pct>0?'bg-primary/10':'bg-muted'}`}>
                        {done
                          ? <CheckCircle2 className="h-6 w-6 text-green-600"/>
                          : <Play className={`h-6 w-6 ${pct>0?'text-primary':'text-muted-foreground'}`}/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground w-5">{idx+1}.</span>
                          <p className="font-bold">{lesson.title}</p>
                          {done && <Badge className="bg-green-100 text-green-700 border-0 text-xs">✓ مكتمل</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {lesson.description && <span className="text-xs text-muted-foreground">{lesson.description}</span>}
                          {types.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {types.map(t=>typeIcons[t]||'').join(' ')}
                            </span>
                          )}
                          {items.length > 0 && <span className="text-xs text-muted-foreground">{items.length} محتوى</span>}
                          {pct > 0 && !done && <span className="text-xs text-primary font-medium">{Math.round(pct)}% مشاهدة</span>}
                        </div>
                      </div>
                      <ChevronLeft className="h-5 w-5 text-muted-foreground shrink-0"/>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}