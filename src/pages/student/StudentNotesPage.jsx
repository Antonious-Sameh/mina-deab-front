import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Bell, Lock, Megaphone, Loader2, CheckCheck, Clock, Eye, X, ZoomIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'; // تأكد من وجود المكون
import { studentAPI, notesAPI } from '@/api/services';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNotifications } from '@/contexts/NotificationContext.jsx';
import { toast } from 'sonner';

const YEAR_LABELS = {
  'first-prep':  'الصف الأول الإعدادي',
  'second-prep': 'الصف الثاني الإعدادي',
  'third-prep':  'الصف الثالث الإعدادي',
  'first-sec':   'الصف الأول الثانوي',
  'second-sec':  'الصف الثاني الثانوي',
  'third-sec':   'الصف الثالث الثانوي',
};

// --- مكون عرض الملاحظة وتفاصيلها ---
function NoteCard({ note, onRead }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const isNew = !note.isRead;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `منذ ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24)  return `منذ ${hrs} ساعة`;
    const days = Math.floor(hrs / 24);
    return `منذ ${days} يوم`;
  };

  const handleClick = async () => {
    // فتح الـ Modal فوراً لتجربة مستخدم سريعة
    setIsOpen(true);
    
    if (!isNew) return;
    try {
      await notesAPI.markRead(note._id);
      onRead(note._id);
    } catch { /* silent */ }
  };

  return (
    <>
      {/* الكارت الخارجي مع تحسين الـ Hover والأنيميشن */}
      <div
        onClick={handleClick}
        className={`relative rounded-xl border p-4 transition-all duration-300 group ${
          isNew
            ? 'border-primary/40 bg-gradient-to-l from-primary/5 to-transparent shadow-sm cursor-pointer hover:border-primary/70 hover:shadow-md'
            : 'border-border bg-card opacity-80 hover:opacity-100 hover:shadow-sm cursor-pointer'
        }`}
      >
        {isNew && (
          <span className="absolute top-3 left-3 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        )}
        
        {/* نص الملاحظة (مختصر في الكارت الخارجي لو طويل) */}
        <p className={`text-sm leading-relaxed line-clamp-3 pl-6 ${isNew ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          {note.text}
        </p>

        {note.imageUrl && (
          <div className="relative mt-3 overflow-hidden rounded-xl border max-h-32 bg-muted/50 group-hover:border-primary/30 transition-colors">
            <img
              src={note.imageUrl}
              alt="صورة الملاحظة"
              loading="lazy"
              className="w-full h-full object-cover blur-[0.5px] group-hover:blur-0 transition-all duration-300"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
              <span className="bg-background/90 text-foreground text-xs font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                <Eye className="h-3.5 w-3.5" /> عرض الصورة كاملة
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/40">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{timeAgo(note.createdAt)}</span>
          {!isNew && <span className="text-xs text-muted-foreground flex items-center gap-1 mr-auto"><CheckCheck className="h-3.5 w-3.5 text-green-500" /> مقروءة</span>}
          {isNew  && <span className="text-xs text-primary font-bold mr-auto group-hover:underline flex items-center gap-1">اضغط للتفاصيل <Eye className="h-3 w-3" /></span>}
        </div>
      </div>

      {/* --- نافذة عرض الملاحظة (Modal) --- */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0 rounded-2xl dir-rtl">
          <DialogHeader className="p-5 border-b bg-muted/30 flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {note.isPrivate ? <Lock className="h-4 w-4 text-primary" /> : <Megaphone className="h-4 w-4 text-primary" />}
              {note.isPrivate ? 'تفاصيل الملاحظة الخاصة' : 'تفاصيل الملاحظة العامة'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* النص كامل */}
            <p className="text-base leading-relaxed text-foreground whitespace-pre-line select-text">
              {note.text}
            </p>

            {/* الصورة بتصميم فخم */}
            {note.imageUrl && (
              <div 
                onClick={() => setIsImageZoomed(true)}
                className="relative mt-4 rounded-xl border overflow-hidden bg-muted cursor-zoom-in group/img shadow-inner"
              >
                <img
                  src={note.imageUrl}
                  alt="المرفق"
                  className="w-full max-h-[350px] object-contain mx-auto transition-transform duration-300 group-hover/img:scale-[1.01]"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <ZoomIn className="h-3.5 w-3.5" /> تكبير المرفق
                </div>
              </div>
            )}

            {/* توقيت وبيانات إضافية أسفل الملاحظة */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                تاريخ الإرسال: {new Date(note.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <Badge variant="secondary" className="font-normal">
                {timeAgo(note.createdAt)}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- شاشة عرض كاملة للصورة المتنقلة (Lightbox) --- */}
      {isImageZoomed && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
        >
          <button 
            onClick={() => setIsImageZoomed(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={note.imageUrl} 
            alt="عرض كامل" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
          />
        </div>
      )}
    </>
  );
}

// --- المكون الرئيسي (بدون تعديل أي لوجيك) ---
export default function StudentNotesPage() {
  const { user } = useAuth();
  const { refresh: refreshCount } = useNotifications();
  const [generalNotes, setGeneralNotes] = useState([]);
  const [privateNotes, setPrivateNotes] = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [tab,          setTab]          = useState('general');

  const load = useCallback(async () => {
    try {
      const d = await studentAPI.notes();
      setGeneralNotes(d.generalNotes || []);
      setPrivateNotes(d.privateNotes || []);
    } catch {
      toast.error('فشل تحميل الملاحظات');
    } finally {
      loading && setLoading(false);
    }
  }, [loading]);

  useEffect(() => { load(); }, [load]);

  const handleRead = (noteId) => {
    setGeneralNotes(prev => prev.map(n => n._id === noteId ? { ...n, isRead: true } : n));
    setPrivateNotes(prev => prev.map(n => n._id === noteId ? { ...n, isRead: true } : n));
    refreshCount();
  };

  const handleMarkAllRead = async () => {
    try {
      await notesAPI.markAllRead();
      setGeneralNotes(prev => prev.map(n => ({ ...n, isRead: true })));
      setPrivateNotes(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshCount();
      toast.success('تم تحديد كل الملاحظات كمقروءة');
    } catch {
      toast.error('فشلت العملية');
    }
  };

  const generalUnread = generalNotes.filter(n => !n.isRead).length;
  const privateUnread = privateNotes.filter(n => !n.isRead).length;
  const totalUnread   = generalUnread + privateUnread;

  return (
    <>
      <Helmet><title>الملاحظات | منصة الطالب</title></Helmet>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-extrabold">الملاحظات</h2>
                <p className="text-muted-foreground text-sm">
                  {totalUnread > 0
                    ? `لديك ${totalUnread} ملاحظة جديدة`
                    : 'جميع الملاحظات مقروءة'}
                </p>
              </div>
            </div>
            {totalUnread > 0 && (
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={handleMarkAllRead}>
                <CheckCheck className="h-4 w-4" />
                تحديد الكل كمقروء
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1 gap-2">
                <Megaphone className="h-4 w-4" />
                ملاحظات عامة
                {generalUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {generalUnread}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="private" className="flex-1 gap-2">
                <Lock className="h-4 w-4" />
                ملاحظات خاصة بي
                {privateUnread > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {privateUnread}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-3">
              {generalNotes.length === 0 ? (
                <div className="text-center py-14 bg-card border rounded-2xl border-dashed">
                  <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground">لا توجد ملاحظات عامة</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    ملاحظات للـ {YEAR_LABELS[user?.academicYear] || ''}
                  </p>
                  {generalNotes.map(note => (
                    <NoteCard key={note._id} note={note} onRead={handleRead} />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="private" className="mt-4 space-y-3">
              {privateNotes.length === 0 ? (
                <div className="text-center py-14 bg-card border rounded-2xl border-dashed">
                  <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground">لا توجد ملاحظات خاصة بك</p>
                </div>
              ) : (
                privateNotes.map(note => (
                  <NoteCard key={note._id} note={note} onRead={handleRead} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}