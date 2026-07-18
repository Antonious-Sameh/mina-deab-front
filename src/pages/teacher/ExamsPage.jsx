import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Plus, Edit, Trash2, Users, FileText, Upload, X, Save,
  Loader2, ToggleLeft, ToggleRight, Eye, Image,
  ClipboardList, Monitor, FileType, ExternalLink, PlusCircle,
  ChevronDown, ChevronUp, Folder, FolderPlus, FolderOpen
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Badge }  from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { examsAPI, paperExamSectionsAPI } from '@/api/services';
import api from '@/api/axios';
import { toast } from 'sonner';
import FileViewerModal from '@/components/FileViewerModal';

const ACADEMIC_YEARS = [
  { value:'first-prep',  label:'الصف الأول الإعدادي'  },
  { value:'second-prep', label:'الصف الثاني الإعدادي' },
  { value:'third-prep',  label:'الصف الثالث الإعدادي' },
  { value:'first-sec',   label:'الصف الأول الثانوي'   },
  { value:'second-sec',  label:'الصف الثاني الثانوي'  },
  { value:'third-sec',   label:'الصف الثالث الثانوي'  },
];
const YEAR_MAP    = Object.fromEntries(ACADEMIC_YEARS.map(y=>[y.value,y.label]));
const STATUS_LABELS = { draft:'مسودة', published:'منشور', closed:'مغلق' };
const STATUS_COLORS = { draft:'bg-muted text-muted-foreground', published:'bg-green-100 text-green-700', closed:'bg-red-100 text-red-700' };

// ── Question Builder (electronic exams) ──────────────────────────────────────
function QuestionBuilder({ questions, onChange }) {
  const fileRefs = useRef({});

  const addQ = (type) => {
    const q = type === 'truefalse'
      ? { text:'', type:'truefalse', options:['صح','خطأ'], correctAnswer:0, points:1, imageUrl:null }
      : { text:'', type:'mcq', options:['','','',''], correctAnswer:0, points:1, imageUrl:null };
    onChange([...questions, q]);
  };

  const updateQ   = (i, k, v)  => onChange(questions.map((q,idx) => idx===i ? {...q,[k]:v} : q));
  const updateOpt = (qi,oi,v)  => onChange(questions.map((q,i) => i===qi ? {...q, options: q.options.map((o,j)=>j===oi?v:o)} : q));
  const removeQ   = (i)        => onChange(questions.filter((_,idx)=>idx!==i));
  const moveQ     = (i,dir)    => { const a=[...questions]; const s=i+dir; if(s<0||s>=a.length)return; [a[i],a[s]]=[a[s],a[i]]; onChange(a); };

  const uploadImage = async (qIdx, file) => {
    if (!file) return;
    const fd = new FormData(); fd.append('avatar', file); // reuse uploadAvatar endpoint for images
    try {
      // Use a temp approach: convert to base64 data URL for preview, upload to cloudinary on save
      const reader = new FileReader();
      reader.onload = (e) => updateQ(qIdx, 'imageUrl', e.target.result);
      reader.readAsDataURL(file);
      toast.info('الصورة ستُرفع عند حفظ الامتحان');
    } catch { toast.error('فشل تحميل الصورة'); }
  };

  return (
    <div className="space-y-3">
      {questions.map((q,idx) => (
        <div key={idx} className={`border-2 rounded-xl p-4 space-y-3 ${q.type==='truefalse'?'border-blue-200 bg-blue-50/30':'border-primary/20 bg-primary/5'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${q.type==='truefalse'?'bg-blue-100 text-blue-700':'bg-primary/10 text-primary'}`}>
              {q.type==='truefalse'?'صح / خطأ':'MCQ'} — {idx+1}
            </span>
            <div className="flex gap-1 mr-auto">
              <button onClick={()=>moveQ(idx,-1)} disabled={idx===0} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5"/></button>
              <button onClick={()=>moveQ(idx,1)} disabled={idx===questions.length-1} className="p-1 rounded hover:bg-muted disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5"/></button>
              <button onClick={()=>removeQ(idx)} className="p-1 rounded hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5"/></button>
            </div>
          </div>

          <div className="space-y-1"><Label className="text-xs">نص السؤال <span className="text-destructive">*</span></Label>
            <Input value={q.text} onChange={e=>updateQ(idx,'text',e.target.value)} placeholder="اكتب السؤال..." className="bg-background"/>
          </div>

          {/* Question image — optional */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Image className="h-3 w-3"/> صورة السؤال (اختياري)</Label>
            {q.imageUrl ? (
              <div className="flex items-center gap-2">
                <img src={q.imageUrl} alt="سؤال" className="h-20 rounded-lg object-contain border bg-white"/>
                <Button size="sm" variant="ghost" className="text-destructive h-7 text-xs" onClick={()=>updateQ(idx,'imageUrl',null)}>حذف</Button>
              </div>
            ) : (
              <>
                <input ref={el=>fileRefs.current[idx]=el} type="file" accept="image/*" className="hidden"
                  onChange={e=>uploadImage(idx,e.target.files?.[0])}/>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={()=>fileRefs.current[idx]?.click()}>
                  <Upload className="h-3 w-3"/> رفع صورة
                </Button>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">الخيارات — اضغط الدائرة لتحديد الصحيح</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt,oi)=>(
                <div key={oi} className={`flex items-center gap-2 rounded-lg border-2 p-2 cursor-pointer transition-all ${q.correctAnswer===oi?'border-green-500 bg-green-50':'border-border bg-background hover:border-primary/40'}`}
                  onClick={()=>updateQ(idx,'correctAnswer',oi)}>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${q.correctAnswer===oi?'border-green-500 bg-green-500':'border-muted-foreground'}`}>
                    {q.correctAnswer===oi && <div className="w-2 h-2 rounded-full bg-white"/>}
                  </div>
                  {q.type==='truefalse'
                    ? <span className="font-bold text-sm">{opt}</span>
                    : <Input value={opt} onClick={e=>e.stopPropagation()} onChange={e=>updateOpt(idx,oi,e.target.value)} placeholder={`الخيار ${oi+1}`} className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0"/>
                  }
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs shrink-0">الدرجة:</Label>
            <Input type="number" min="0.5" step="0.5" value={q.points} onChange={e=>updateQ(idx,'points',Number(e.target.value))} className="w-20 h-7 text-sm bg-background"/>
            <span className="text-xs text-muted-foreground">درجة</span>
          </div>
        </div>
      ))}
      <div className="flex gap-3 pt-1">
        <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={()=>addQ('mcq')}><PlusCircle className="h-4 w-4 text-primary"/> سؤال MCQ</Button>
        <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={()=>addQ('truefalse')}><PlusCircle className="h-4 w-4 text-blue-500"/> صح / خطأ</Button>
      </div>
    </div>
  );
}

// ── Section Picker (paper exams only) — choose an existing folder, or type a new one ──
function SectionPicker({ academicYear, value, onChange }) {
  const [sections, setSections] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    if (!academicYear) { setSections([]); return; }
    setLoading(true);
    paperExamSectionsAPI.getAll(academicYear)
      .then(d => setSections(d.sections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [academicYear]);

  const handleSelect = (val) => {
    if (val === '__new__') {
      setCreatingNew(true);
      onChange({ sectionId: null, sectionName: '' });
    } else {
      setCreatingNew(false);
      onChange({ sectionId: val, sectionName: null });
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>قسم الامتحان <span className="text-destructive">*</span></Label>
      {!creatingNew ? (
        <Select value={value.sectionId || undefined} onValueChange={handleSelect} disabled={!academicYear || loading}>
          <SelectTrigger>
            <SelectValue placeholder={!academicYear ? 'اختر السنة الدراسية أولاً' : (loading ? 'جاري التحميل...' : 'اختر قسماً موجوداً أو أضف قسم جديد...')} />
          </SelectTrigger>
          <SelectContent>
            {sections.map(s => (
              <SelectItem key={s._id} value={s._id}>📁 {s.name} ({s.examCount})</SelectItem>
            ))}
            <SelectItem value="__new__">
              <span className="flex items-center gap-1.5 text-primary font-medium"><FolderPlus className="h-3.5 w-3.5" /> قسم جديد...</span>
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            value={value.sectionName || ''}
            onChange={e => onChange({ sectionId: null, sectionName: e.target.value })}
            placeholder="اكتب اسم القسم الجديد (مثال: مسابقة 1)..."
            autoFocus
          />
          <Button type="button" size="sm" variant="outline" onClick={() => { setCreatingNew(false); onChange({ sectionId: null, sectionName: null }); }}>
            إلغاء
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Exam Form Modal ───────────────────────────────────────────────────────────
function ExamModal({ exam, onClose, onSaved }) {
  const isEdit   = !!exam;
  const [examType, setExamType] = useState(exam?.examType || 'electronic');
  const [form, setForm] = useState({
    title:        exam?.title        || '',
    academicYear: exam?.academicYear || '',
    description:  exam?.description  || '',
    examDate:     exam?.examDate ? exam.examDate.slice(0,10) : '',
    duration:     exam?.duration     || '',
    maxScore:     exam?.maxScore     || '',
    status:       exam?.status       || 'draft',
    questions:    exam?.questions    || [],
  });
  const [section, setSection] = useState({
    sectionId:   exam?.section?._id || null,
    sectionName: null,
  });
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState('info');
  const [paperFile, setPaperFile] = useState(null);
  const [viewerModal, setViewerModal] = useState(null); // { url, type }
  const fileRef = useRef(null);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const setYear = (v) => { set('academicYear', v); setSection({ sectionId: null, sectionName: null }); };
  const totalPoints = form.questions.reduce((s,q)=>s+(q.points||1),0);

  const handleSave = async () => {
    if (!form.title.trim())    { toast.error('عنوان الامتحان مطلوب'); return; }
    if (!form.academicYear)    { toast.error('السنة الدراسية مطلوبة'); return; }
    if (examType==='electronic' && form.questions.length===0) { toast.error('أضف سؤالاً واحداً على الأقل'); setTab('questions'); return; }
    if (examType==='paper' && !isEdit && !paperFile && !exam?.paperFileUrl) { toast.error('ارفع ملف الامتحان'); return; }
    if (examType==='paper' && !section.sectionId && !section.sectionName?.trim()) { toast.error('اختر قسم الامتحان أو أضف قسماً جديداً'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), academicYear: form.academicYear,
        description: form.description.trim()||null,
        examDate: form.examDate||null, duration: form.duration?Number(form.duration):null,
        status: form.status, examType,
        questions:     examType==='electronic' ? form.questions : [],
        maxScore:      examType==='paper' ? Number(form.maxScore)||0 : 0,
      };
      if (examType==='paper') {
        if (section.sectionId) payload.sectionId = section.sectionId;
        else if (section.sectionName?.trim()) payload.sectionName = section.sectionName.trim();
      }

      let savedExam;
      if (isEdit) {
        const r = await api.put(`/exams/${exam._id}`, payload);
        savedExam = r.data.data.exam;
        toast.success('تم تعديل الامتحان');
      } else {
        const r = await api.post('/exams', payload);
        savedExam = r.data.data.exam;
        toast.success('تم إنشاء الامتحان ✓');
      }

      // Upload paper file if provided
      if (examType==='paper' && paperFile && savedExam?._id) {
        const fd = new FormData(); fd.append('paperFile', paperFile);
        await api.post(`/exams/${savedExam._id}/paper-file`, fd, { headers:{'Content-Type':'multipart/form-data'} });
      }

      onSaved();
    } catch (err) { toast.error(err?.response?.data?.message||'فشلت العملية'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card rounded-t-2xl z-10">
          <div>
            <h3 className="font-bold text-lg">{isEdit?'تعديل الامتحان':'إنشاء امتحان جديد'}</h3>
            {examType==='electronic' && form.questions.length>0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{form.questions.length} سؤال — {totalPoints} درجة</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4"/></Button>
        </div>

        {/* Exam type selector */}
        <div className="px-5 pt-4 pb-2 border-b bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground mb-2">نوع الامتحان</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>setExamType('electronic')} className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all ${examType==='electronic'?'border-primary bg-primary/5':'border-border hover:border-primary/40'}`}>
              <Monitor className={`h-5 w-5 ${examType==='electronic'?'text-primary':'text-muted-foreground'}`}/>
              <div className="text-right">
                <p className={`text-sm font-bold ${examType==='electronic'?'text-primary':''}`}>إلكتروني</p>
                <p className="text-xs text-muted-foreground">MCQ + صح/خطأ + تصحيح تلقائي</p>
              </div>
            </button>
            <button onClick={()=>setExamType('paper')} className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all ${examType==='paper'?'border-orange-400 bg-orange-50':'border-border hover:border-orange-200'}`}>
              <ClipboardList className={`h-5 w-5 ${examType==='paper'?'text-orange-500':'text-muted-foreground'}`}/>
              <div className="text-right">
                <p className={`text-sm font-bold ${examType==='paper'?'text-orange-600':''}`}>ورقي</p>
                <p className="text-xs text-muted-foreground">رفع PDF أو صورة الامتحان</p>
              </div>
            </button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="info" className="flex-1">معلومات</TabsTrigger>
            {examType==='electronic' && (
              <TabsTrigger value="questions" className="flex-1">
                الأسئلة {form.questions.length>0&&<span className="mr-1.5 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">{form.questions.length}</span>}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="info" className="p-5 space-y-4">
            <div className="space-y-1.5"><Label>عنوان الامتحان <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="مثال: امتحان الفصل الأول" autoFocus/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>السنة الدراسية <span className="text-destructive">*</span></Label>
                <Select value={form.academicYear} onValueChange={setYear}>
                  <SelectTrigger><SelectValue placeholder="اختر..."/></SelectTrigger>
                  <SelectContent>{ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v=>set('status',v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="published">منشور للطلاب</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>تاريخ الامتحان</Label>
                <Input type="date" value={form.examDate} onChange={e=>set('examDate',e.target.value)}/>
              </div>
              {examType==='electronic'
                ? <div className="space-y-1.5"><Label>المدة (دقائق)</Label><Input type="number" min="1" value={form.duration} onChange={e=>set('duration',e.target.value)} placeholder="مثال: 60"/></div>
                : <div className="space-y-1.5"><Label>الدرجة الكلية</Label><Input type="number" min="0" value={form.maxScore} onChange={e=>set('maxScore',e.target.value)} placeholder="مثال: 50"/></div>
              }
            </div>
            <div className="space-y-1.5"><Label>تعليمات (اختياري)</Label>
              <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={2} placeholder="تعليمات للطلاب..." className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"/>
            </div>

            {/* Section picker — paper exams only */}
            {examType==='paper' && (
              <SectionPicker academicYear={form.academicYear} value={section} onChange={setSection} />
            )}

            {/* Paper file upload */}
            {examType==='paper' && (
              <div className="space-y-1.5 border-2 border-orange-200 bg-orange-50/40 rounded-xl p-4">
                <Label className="text-orange-700 font-semibold">ملف الامتحان الورقي <span className="text-destructive">*</span></Label>
                {(exam?.paperFileUrl && !paperFile) ? (
                  <div className="flex items-center gap-2 text-sm">
                    <FileType className="h-4 w-4 text-orange-500"/>
                    <span className="text-muted-foreground">ملف موجود</span>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                      onClick={() => setViewerModal({ url: exam.paperFileUrl, type: exam.paperFileType })}>
                      <Eye className="h-3 w-3"/>عرض
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={()=>fileRef.current?.click()}>تغيير</Button>
                  </div>
                ) : (
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 transition-colors ${paperFile?'border-orange-400 bg-orange-50':'border-orange-200'}`}
                    onClick={()=>fileRef.current?.click()}>
                    {paperFile
                      ? <p className="text-sm font-medium text-orange-700">{paperFile.name}</p>
                      : <><Upload className="h-8 w-8 text-orange-300 mx-auto mb-2"/><p className="text-sm text-muted-foreground">اضغط لرفع PDF أو صورة الامتحان</p></>
                    }
                  </div>
                )}
                <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={e=>setPaperFile(e.target.files?.[0]||null)}/>
              </div>
            )}
          </TabsContent>

          {examType==='electronic' && (
            <TabsContent value="questions" className="p-5">
              <QuestionBuilder questions={form.questions} onChange={qs=>set('questions',qs)}/>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Save className="h-4 w-4"/>}
            {saving?'جاري الحفظ...':(isEdit?'حفظ التعديلات':'إنشاء الامتحان')}
          </Button>
        </div>
      </div>

      {viewerModal && (
        <FileViewerModal
          url={viewerModal.url}
          type={viewerModal.type}
          title="معاينة الملف"
          onClose={() => setViewerModal(null)}
        />
      )}
    </div>
  );
}

// ── Answer Sheets Section (multiple files: add / list / delete) ──────────────
function AnswerSheetsSection({ sheets = [], examId, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [viewerData, setViewerData] = useState(null);
  const fileRef = useRef(null);
  const endpoint = `/exams/${examId}/answer-sheet`;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('answerSheets', f));
      const r = await api.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      const newSheets = r.data.data?.answerSheets || [];
      onUpdated(newSheets);
      toast.success('تم رفع النموذج ✓');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الرفع');
    } finally { setUploading(false); e.target.value = ''; }
  };

  const handleDelete = async (sheetId) => {
    if (!window.confirm('حذف نموذج الإجابة؟')) return;
    setDeletingId(sheetId);
    try {
      const r = await api.delete(`${endpoint}/${sheetId}`, { timeout: 15000 });
      const newSheets = r.data.data?.answerSheets || [];
      onUpdated(newSheets);
      toast.success('تم الحذف');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الحذف');
    } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-1.5">
      {sheets.map((s, i) => (
        <div key={s._id || i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-xs border">
          {s.type === 'pdf' ? <FileType className="h-4 w-4 text-red-500 shrink-0"/> : <Image className="h-4 w-4 text-blue-500 shrink-0"/>}
          <span className="flex-1 truncate text-muted-foreground">{s.type === 'pdf' ? 'ملف PDF' : 'صورة'} {i + 1}</span>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1" onClick={() => setViewerData({ url: s.url, type: s.type })}>
            <Eye className="h-3 w-3"/>عرض
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-destructive hover:text-destructive" disabled={deletingId===s._id} onClick={()=>handleDelete(s._id)}>
            {deletingId===s._id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3"/>}
          </Button>
        </div>
      ))}

      <Button size="sm" variant="outline" className="gap-1.5 mt-1.5 w-full h-8 text-xs" onClick={()=>fileRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-3 w-3 animate-spin"/> : <Upload className="h-3 w-3"/>}
        {uploading ? 'جاري الرفع...' : 'إضافة نموذج إجابة (PDF أو صورة، يمكن تحديد أكثر من ملف)'}
      </Button>
      <input ref={fileRef} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={handleFiles}/>

      {viewerData && (
        <FileViewerModal url={viewerData.url} type={viewerData.type} title="نموذج الإجابة" onClose={() => setViewerData(null)} />
      )}
    </div>
  );
}

// ── File Section (paper file — single-file upload/delete) ────────────────────
function FileSection({ label, url, type, endpoint, onUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null); // inline viewer
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append(endpoint.includes('paper') ? 'paperFile' : 'answerSheet', file);
      const r = await api.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s for file uploads to Cloudinary
      });
      onUpdated(r.data.data);
      toast.success('تم الرفع ✓');
    } catch (err) {
      // Show specific error if server returned one, otherwise generic
      const msg = err.response?.data?.message || err.message || 'فشل الرفع';
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDel = async () => {
    if (!window.confirm('حذف الملف؟')) return;
    setDeleting(true);
    try {
      await api.delete(endpoint, { timeout: 15000 });
      onUpdated({ url: null, type: null });
      toast.success('تم الحذف');
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل الحذف';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (url) return (
    <>
      <div className="flex items-center gap-2 mt-1.5 p-2 bg-muted/30 rounded-lg text-xs border">
        {type === 'pdf'
          ? <FileType className="h-4 w-4 text-red-500 shrink-0"/>
          : <Image   className="h-4 w-4 text-blue-500 shrink-0"/>}
        <span className="flex-1 truncate text-muted-foreground">{label} مرفوع</span>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1"
          onClick={() => setViewerUrl(url)}>
          <Eye className="h-3 w-3"/>عرض
        </Button>
        <Button size="sm" variant="ghost"
          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
          disabled={deleting} onClick={handleDel}>
          {deleting ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-3 w-3"/>}
        </Button>
      </div>
      {viewerUrl && (
        <FileViewerModal url={viewerUrl} type={type} title={label} onClose={() => setViewerUrl(null)} />
      )}
    </>
  );

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5 mt-1.5 w-full h-8 text-xs"
        onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-3 w-3 animate-spin"/> : <Upload className="h-3 w-3"/>}
        {uploading ? 'جاري الرفع...' : `رفع ${label} (PDF أو صورة)`}
      </Button>
      <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile}/>
    </>
  );
}

// ── Results Panel ─────────────────────────────────────────────────────────────
function ResultsPanel({ examId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/exams/${examId}/results`).then(r=>setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, [examId]);
  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>;
  if (!data)   return <p className="text-center text-muted-foreground text-sm py-4">فشل تحميل النتائج</p>;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        {[{label:'حللوا',value:data.summary.total},{label:'متوسط',value:data.summary.average},{label:'أعلى',value:data.summary.highest},{label:'أدنى',value:data.summary.lowest}].map(s=>(
          <div key={s.label} className="bg-muted/40 rounded-lg p-2"><p className="font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
        ))}
      </div>
      {data.submissions.length===0 ? <p className="text-center text-muted-foreground text-sm py-4">لا يوجد طلاب حلوا الامتحان بعد</p> : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr><th className="px-4 py-2">#</th><th className="px-4 py-2">الطالب</th><th className="px-4 py-2">الدرجة</th><th className="px-4 py-2">النسبة</th></tr>
            </thead>
            <tbody className="divide-y">
              {data.submissions.map((s,i)=>(
                <tr key={s._id} className="hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground">{i+1}</td>
                  <td className="px-4 py-2.5 font-bold">{s.student?.name}</td>
                  <td className="px-4 py-2.5 font-bold">{s.score}/{data.exam.maxScore}</td>
                  <td className="px-4 py-2.5"><span className={`font-bold ${s.percentage>=50?'text-green-600':'text-red-500'}`}>{s.percentage}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExamsPage() {
  const [exams,      setExams]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filterYear, setFilterYear] = useState('');
  const [modal,      setModal]      = useState(null);
  const [resultsFor, setResultsFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await examsAPI.getAll(filterYear ? { year:filterYear } : {});
      setExams(d.exams || []);
    } catch { toast.error('فشل تحميل الامتحانات'); }
    finally { setLoading(false); }
  }, [filterYear]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (exam) => {
    if (!window.confirm(`هل تريد حذف "${exam.title}"؟`)) return;
    try { await examsAPI.remove(exam._id); toast.success('تم الحذف'); load(); }
    catch (err) { toast.error(err?.response?.data?.message||'فشل الحذف'); }
  };

  const handleStatusToggle = async (exam) => {
    const next = exam.status==='published'?'draft':'published';
    try { await examsAPI.changeStatus(exam._id, next); toast.success(next==='published'?'تم النشر':'تم التحويل لمسودة'); load(); }
    catch { toast.error('فشل تغيير الحالة'); }
  };

  const updateExamLocal = (examId, patch) => setExams(p=>p.map(e=>e._id===examId?{...e,...patch}:e));

  const [openSections, setOpenSections] = useState({}); // sectionKey -> bool
  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  // إلكتروني يفضل زي ما هو — مرصوص عادي. الورقي بس هو اللي بيتقسم لأقسام.
  // ممت memoized عشان ما يتحسبوش تاني مع كل toggle لأكورديون (openSections) —
  // بس لما exams نفسها تتغير.
  const electronicExams = useMemo(() => exams.filter(e => e.examType !== 'paper'), [exams]);
  const paperExams      = useMemo(() => exams.filter(e => e.examType === 'paper'), [exams]);

  const sectionGroups = useMemo(() => {
    const map = {};
    const order = [];
    paperExams.forEach(e => {
      const key = e.section?._id || '__none__';
      if (!map[key]) { map[key] = { key, name: e.section?.name || 'بدون قسم', exams: [] }; order.push(key); }
      map[key].exams.push(e);
    });
    // "بدون قسم" آخر حاجة لو موجودة
    return order.sort((a,b) => (a==='__none__'?1:0) - (b==='__none__'?1:0)).map(k => map[k]);
  }, [paperExams]);

  const renderExamItem = (exam) => (
    <AccordionItem key={exam._id} value={exam._id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full pr-2 text-right">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">{exam.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[exam.status]}`}>{STATUS_LABELS[exam.status]}</span>
              {/* Type badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.examType==='paper'?'bg-orange-100 text-orange-700':'bg-blue-100 text-blue-700'}`}>
                {exam.examType==='paper'?'ورقي':'إلكتروني'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span>{YEAR_MAP[exam.academicYear]}</span>
              {exam.examType==='electronic' && exam.questions?.length>0 && <span>{exam.questions.length} سؤال — {exam.maxScore} درجة</span>}
              {exam.examType==='paper' && exam.maxScore>0 && <span>{exam.maxScore} درجة</span>}
              {exam.examDate && <span>{new Date(exam.examDate).toLocaleDateString('ar-EG')}</span>}
              {exam.submissionsCount>0 && <span className="text-green-600 font-medium">{exam.submissionsCount} حلوه</span>}
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="border-t bg-muted/10">
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={()=>setModal({exam})}><Edit className="h-3.5 w-3.5"/>تعديل</Button>
            <Button size="sm" variant="outline" className={`gap-1.5 h-8 text-xs ${exam.status==='published'?'border-orange-300 text-orange-600':'border-green-300 text-green-600'}`} onClick={()=>handleStatusToggle(exam)}>
              {exam.status==='published'?<><ToggleRight className="h-3.5 w-3.5"/>تحويل لمسودة</>:<><ToggleLeft className="h-3.5 w-3.5"/>نشر للطلاب</>}
            </Button>
            {exam.examType==='electronic' && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-blue-300 text-blue-600" onClick={()=>setResultsFor(resultsFor===exam._id?null:exam._id)}>
                <Users className="h-3.5 w-3.5"/>النتائج
              </Button>
            )}
            <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive mr-auto" onClick={()=>handleDelete(exam)}><Trash2 className="h-3.5 w-3.5"/>حذف</Button>
          </div>

          {/* Paper file section */}
          {exam.examType==='paper' && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">ملف الامتحان الورقي</p>
              <FileSection
                label="ملف الامتحان" url={exam.paperFileUrl} type={exam.paperFileType}
                endpoint={`/exams/${exam._id}/paper-file`}
                onUpdated={d=>updateExamLocal(exam._id, { paperFileUrl:d.paperFileUrl||d.url, paperFileType:d.paperFileType||d.type })}
              />
            </div>
          )}

          {/* Answer sheet(s) — multiple files supported */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">نماذج الإجابة</p>
            <AnswerSheetsSection
              sheets={exam.answerSheets?.length ? exam.answerSheets : (exam.answerSheetUrl ? [{ _id: 'legacy', url: exam.answerSheetUrl, type: exam.answerSheetType }] : [])}
              examId={exam._id}
              onUpdated={(sheets) => updateExamLocal(exam._id, { answerSheets: sheets, answerSheetUrl: sheets[sheets.length-1]?.url || null, answerSheetType: sheets[sheets.length-1]?.type || null })}
            />
          </div>

          {/* Questions preview (electronic only) */}
          {exam.examType==='electronic' && exam.questions?.length>0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">معاينة الأسئلة</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {exam.questions.map((q,i)=>(
                  <div key={i} className="flex items-start gap-2 text-sm bg-background rounded-lg px-3 py-2">
                    <span className="text-muted-foreground shrink-0 w-5 text-xs mt-0.5">{i+1}.</span>
                    <div className="flex-1 min-w-0">
                      {q.imageUrl && <img src={q.imageUrl} alt="" className="h-12 rounded mb-1 object-contain bg-white border"/>}
                      <p className="font-medium leading-snug">{q.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {q.type==='truefalse'?'صح/خطأ':`MCQ · ${q.options.filter(Boolean).length} خيارات`}
                        {' · '}الإجابة: <span className="text-green-600 font-bold">{q.options[q.correctAnswer]}</span>
                        {' · '}{q.points} درجة
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultsFor===exam._id && exam.examType==='electronic' && (
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">نتائج الطلاب</p>
              <ResultsPanel examId={exam._id}/>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <>
      <Helmet><title>الامتحانات | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">الامتحانات</h2>
            <p className="text-muted-foreground text-sm">{loading?'...': `${exams.length} امتحان`}</p>
          </div>
          <Button className="gap-2 shadow-md" onClick={()=>setModal('create')}><Plus className="h-5 w-5"/>إنشاء امتحان جديد</Button>
        </div>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-52"><SelectValue placeholder="كل السنوات"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل السنوات</SelectItem>
            {ACADEMIC_YEARS.map(y=><SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
        : exams.length===0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30"/>
            <h3 className="text-lg font-bold">لا توجد امتحانات</h3>
          </div>
        ) : (
          <div className="space-y-6">
            {/* الامتحانات الإلكترونية — زي ما هي بالظبط، مرصوصة عادي */}
            {electronicExams.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-muted-foreground flex items-center gap-1.5">
                  <Monitor className="h-4 w-4"/> الامتحانات الإلكترونية
                </h3>
                <Accordion type="multiple" className="space-y-3">
                  {electronicExams.map(renderExamItem)}
                </Accordion>
              </div>
            )}

            {/* الامتحانات الورقية — مقسّمة داخل أقسام (📁 فولدرات) */}
            {paperExams.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-muted-foreground flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4"/> الامتحانات الورقية
                </h3>
                <div className="space-y-3">
                  {sectionGroups.map(group => {
                    const isOpen = openSections[group.key] !== false; // مفتوح افتراضياً
                    return (
                      <div key={group.key} className="bg-muted/20 border rounded-2xl overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                          onClick={() => toggleSection(group.key)}
                        >
                          <div className="flex items-center gap-2">
                            {isOpen ? <FolderOpen className="h-4 w-4 text-orange-500"/> : <Folder className="h-4 w-4 text-orange-500"/>}
                            <span className="font-bold text-sm">{group.name}</span>
                            <Badge variant="secondary" className="text-xs">{group.exams.length}</Badge>
                          </div>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground"/> : <ChevronDown className="h-4 w-4 text-muted-foreground"/>}
                        </button>
                        {isOpen && (
                          <div className="p-3 pt-0 space-y-3">
                            <Accordion type="multiple" className="space-y-3">
                              {group.exams.map(renderExamItem)}
                            </Accordion>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {modal==='create' && <ExamModal onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
      {modal?.exam       && <ExamModal exam={modal.exam} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
    </>
  );
}