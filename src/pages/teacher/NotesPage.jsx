import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { MessageSquare, Trash2, Users, Send, StickyNote, Loader2, Search, X, Image, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button }   from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Badge }    from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notesAPI, studentsAPI } from '@/api/services';
import api from '@/api/axios';
import { toast } from 'sonner';

const ACADEMIC_YEARS = [
  { value:'first-prep',  label:'الصف الأول الإعدادي'  },
  { value:'second-prep', label:'الصف الثاني الإعدادي' },
  { value:'third-prep',  label:'الصف الثالث الإعدادي' },
  { value:'first-sec',   label:'الصف الأول الثانوي'   },
  { value:'second-sec',  label:'الصف الثاني الثانوي'  },
];

const normalizeAr = (s='') =>
  s.toLowerCase().replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي').trim();

// ── Image picker component ────────────────────────────────────────────────────
function ImagePicker({ imageUrl, onChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    if (file.size > 4*1024*1024) { toast.error('الصورة يجب أن تكون أقل من 4 ميجا'); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('noteImage', file);
      const r  = await api.post('/notes/upload-image', fd, { headers:{'Content-Type':'multipart/form-data'} });
      onChange(r.data.data.imageUrl);
      toast.success('تم رفع الصورة ✓');
    } catch { toast.error('فشل رفع الصورة'); }
    finally { setUploading(false); e.target.value=''; }
  };

  if (imageUrl) return (
    <div className="relative inline-block">
      <img src={imageUrl} alt="ملاحظة" className="max-h-32 rounded-xl border object-contain bg-muted"/>
      <button onClick={()=>onChange(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow">
        <X className="h-3.5 w-3.5"/>
      </button>
    </div>
  );

  return (
    <>
      <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={()=>fileRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Image className="h-3.5 w-3.5"/>}
        {uploading ? 'جاري الرفع...' : 'إضافة صورة (اختياري)'}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
    </>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────
function NoteCard({ note, onDelete, yearLabel }) {
  const timeAgo = (d) => {
    const m = Math.floor((Date.now()-new Date(d).getTime())/60000);
    if(m<60) return `منذ ${m} دقيقة`;
    const h=Math.floor(m/60); if(h<24) return `منذ ${h} ساعة`;
    return `منذ ${Math.floor(h/24)} يوم`;
  };
  return (
    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
      {note.type==='general'
        ? <StickyNote className="h-4 w-4 text-primary shrink-0 mt-0.5"/>
        : <MessageSquare className="h-4 w-4 text-blue-500 shrink-0 mt-0.5"/>}
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm leading-relaxed">{note.text}</p>
        {note.imageUrl && (
          <img src={note.imageUrl} alt="صورة الملاحظة" className="max-h-40 rounded-xl border object-contain bg-muted"/>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {yearLabel && <Badge variant="outline" className="text-xs">{yearLabel}</Badge>}
          {note.student?.name && <Badge variant="outline" className="text-xs">{note.student.name}</Badge>}
          <span className="text-xs text-muted-foreground">{timeAgo(note.createdAt)}</span>
        </div>
      </div>
      <button onClick={()=>onDelete(note._id)} className="text-muted-foreground hover:text-destructive shrink-0">
        <Trash2 className="h-4 w-4"/>
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [tab,          setTab]          = useState('general');
  const [generalNotes, setGeneralNotes] = useState([]);
  const [privateNotes, setPrivateNotes] = useState([]);
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [genYear,      setGenYear]      = useState('');
  const [genText,      setGenText]      = useState('');
  const [genImage,     setGenImage]     = useState(null);
  const [privText,     setPrivText]     = useState('');
  const [privImage,    setPrivImage]    = useState(null);
  const [sending,      setSending]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDropdown,    setShowDropdown]    = useState(false);

  useEffect(() => {
    // ملحوظة: الـ backend بيحدد أقصى limit للصفحة الواحدة (100)، فمينفعش
    // نجيب كل الطلاب بطلب واحد لو عددهم أكبر من كده. عشان كده بنلف على
    // كل الصفحات ونجمعها، عشان البحث عن الطالب يشتغل على كل الطلاب فعلاً.
    const loadAllStudents = async () => {
      let list = [];
      let page = 1;
      let totalPages = 1;
      try {
        do {
          const d = await studentsAPI.getAll({ limit: 100, page });
          list = list.concat(d.data || []);
          totalPages = d.pagination?.pages || 1;
          page += 1;
        } while (page <= totalPages);
        setStudents(list);
      } catch {}
    };
    loadAllStudents();
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const [gd,pd] = await Promise.all([notesAPI.getAll({type:'general'}), notesAPI.getAll({type:'private'})]);
      setGeneralNotes(gd.notes||[]);
      setPrivateNotes(pd.notes||[]);
    } catch { toast.error('فشل تحميل الملاحظات'); }
    finally { setLoading(false); }
  };

  const filteredStudents = useMemo(() => {
    if(!search.trim()) return [];
    const q = normalizeAr(search);
    return students.filter(s=>normalizeAr(s.name).includes(q)).slice(0,8);
  }, [search, students]);

  const selectStudent = (s) => { setSelectedStudent(s); setSearch(s.name); setShowDropdown(false); };
  const clearStudent  = ()  => { setSelectedStudent(null); setSearch(''); };

  const addGeneral = async () => {
    if (!genYear||!genText.trim()) { toast.error('اختر السنة واكتب الملاحظة'); return; }
    setSending(true);
    try {
      await notesAPI.create({ type:'general', text:genText.trim(), academicYear:genYear, imageUrl:genImage||null });
      toast.success('تم الإرسال ✓');
      setGenText(''); setGenImage(null);
      loadNotes();
    } catch (err) { toast.error(err?.response?.data?.message||'فشل الإرسال'); }
    finally { setSending(false); }
  };

  const addPrivate = async () => {
    if(!selectedStudent||!privText.trim()) { toast.error('اختر الطالب واكتب الملاحظة'); return; }
    setSending(true);
    try {
      await notesAPI.create({ type:'private', text:privText.trim(), studentId:selectedStudent._id, imageUrl:privImage||null });
      toast.success('تم الإرسال ✓');
      setPrivText(''); setPrivImage(null);
      loadNotes();
    } catch (err) { toast.error(err?.response?.data?.message||'فشل الإرسال'); }
    finally { setSending(false); }
  };

  const deleteNote = async (id) => {
    if(!window.confirm('حذف الملاحظة؟')) return;
    try { await notesAPI.remove(id); toast.success('تم الحذف'); loadNotes(); }
    catch { toast.error('فشل الحذف'); }
  };

  return (
    <>
      <Helmet><title>الملاحظات | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-extrabold">الملاحظات</h2>
          <p className="text-muted-foreground text-sm mt-0.5">إرسال ملاحظات عامة أو خاصة مع إمكانية إرفاق صورة</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1 gap-2">
              <Users className="h-4 w-4"/> عامة
              {generalNotes.length>0 && <Badge variant="secondary">{generalNotes.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="private" className="flex-1 gap-2">
              <MessageSquare className="h-4 w-4"/> خاصة
              {privateNotes.length>0 && <Badge variant="secondary">{privateNotes.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="mt-4 space-y-4">
            <Card className="border shadow-sm">
              <CardContent className="p-5 space-y-3">
                <Select value={genYear} onValueChange={setGenYear}>
                  <SelectTrigger><SelectValue placeholder="اختر السنة الدراسية..."/></SelectTrigger>
                  <SelectContent>{ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea value={genText} onChange={e=>setGenText(e.target.value)} placeholder="اكتب الملاحظة..." rows={3}/>
                <ImagePicker imageUrl={genImage} onChange={setGenImage}/>
                <Button className="w-full gap-2" onClick={addGeneral} disabled={sending||!genYear||!genText.trim()}>
                  {sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} إرسال
                </Button>
              </CardContent>
            </Card>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
              : generalNotes.length===0 ? <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground">لا توجد ملاحظات عامة</div>
              : <div className="space-y-2">{generalNotes.map(n=><NoteCard key={n._id} note={n} onDelete={deleteNote} yearLabel={ACADEMIC_YEARS.find(y=>y.value===n.academicYear)?.label}/>)}</div>}
          </TabsContent>

          {/* Private */}
          <TabsContent value="private" className="mt-4 space-y-4">
            <Card className="border shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">ابحث عن الطالب</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
                    <Input value={search} onChange={e=>{setSearch(e.target.value);setSelectedStudent(null);setShowDropdown(true);}} onFocus={()=>setShowDropdown(true)} placeholder="اكتب أي جزء من الاسم..." className="pr-9 pl-8"/>
                    {search && <button onClick={clearStudent} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button>}
                    {showDropdown && filteredStudents.length>0 && !selectedStudent && (
                      <div className="absolute z-20 w-full mt-1 bg-card border rounded-xl shadow-lg overflow-hidden">
                        {filteredStudents.map(s=>(
                          <button key={s._id} className="w-full text-right px-4 py-2.5 hover:bg-muted text-sm flex items-center justify-between gap-2" onClick={()=>selectStudent(s)}>
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{s.codePlain}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedStudent && (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5">
                      <span className="text-sm font-semibold text-primary flex-1">✓ {selectedStudent.name}</span>
                      <span className="text-xs font-mono text-muted-foreground">{selectedStudent.codePlain}</span>
                    </div>
                  )}
                </div>
                <Textarea value={privText} onChange={e=>setPrivText(e.target.value)} placeholder="اكتب الملاحظة الخاصة..." rows={3}/>
                <ImagePicker imageUrl={privImage} onChange={setPrivImage}/>
                <Button className="w-full gap-2" onClick={addPrivate} disabled={sending||!selectedStudent||!privText.trim()}>
                  {sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>} إرسال للطالب
                </Button>
              </CardContent>
            </Card>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
              : privateNotes.length===0 ? <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground">لا توجد ملاحظات خاصة</div>
              : <div className="space-y-2">{privateNotes.map(n=><NoteCard key={n._id} note={n} onDelete={deleteNote}/>)}</div>}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}