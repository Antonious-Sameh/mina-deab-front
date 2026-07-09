import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  FileText, Clock, CheckCircle2, AlertCircle, Loader2,
  ChevronLeft, Star, XCircle, Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { studentAPI } from '@/api/services';
import api from '@/api/axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import FileViewerModal from '@/components/FileViewerModal';

const YEAR_LABELS = {
  'first-prep':  'الصف الأول الإعدادي',
  'second-prep': 'الصف الثاني الإعدادي',
  'third-prep':  'الصف الثالث الإعدادي',
  'first-sec':   'الصف الأول الثانوي',
  'second-sec':  'الصف الثاني الثانوي',
};

// ── Result Detail Modal ───────────────────────────────────────────────────────
// ── Result Detail Modal — score only, no answer details shown ────────────────
function ResultModal({ exam, submission, onClose }) {
  const pct    = submission?.percentage || 0;
  const passed = pct >= 50;
  const [viewingSheets, setViewingSheets] = useState(false);
  const hasSheets = exam.answerSheets?.length || exam.answerSheetUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        
        {/* ملخص الدرجة فقط */}
        <div className={`p-8 rounded-t-2xl text-center ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            {passed
              ? <CheckCircle2 className="h-10 w-10 text-green-600" />
              : <XCircle      className="h-10 w-10 text-red-500"   />}
          </div>
          <h3 className="text-lg font-black mb-3">{exam.title}</h3>
          <p className={`text-6xl font-black mb-1 ${passed ? 'text-green-600' : 'text-red-500'}`}>
            {submission.score}
          </p>
          <p className="text-muted-foreground text-sm mb-1">من {submission.maxScore} درجة</p>
          <p className={`text-xl font-bold ${passed ? 'text-green-700' : 'text-red-600'}`}>{pct}%</p>
        </div>

        {/* الأزرار ونموذج الإجابة إن وجد */}
        <div className="p-5 space-y-3">
          <p className={`text-center text-sm font-medium ${passed ? 'text-green-700' : 'text-orange-600'}`}>
            {passed ? '✓ أحسنت! نتيجة جيدة' : 'يمكنك التحسن في المرة القادمة'}
          </p>
          
          {hasSheets && (
            <Button variant="outline" className="w-full gap-2" onClick={() => setViewingSheets(true)}>
              <Eye className="h-4 w-4" /> عرض نموذج الإجابة الرسمي
            </Button>
          )}
          
          <Button className="w-full" onClick={onClose}>إغلاق</Button>
        </div>

        {viewingSheets && <AnswerSheetsModal exam={exam} onClose={() => setViewingSheets(false)} />}
      </div>
    </div>
  );
}

// ── Answer Sheets Viewer Modal — opens files inline, no download ─────────────
function AnswerSheetsModal({ exam, onClose }) {
  const sheets = exam.answerSheets?.length
    ? exam.answerSheets
    : (exam.answerSheetUrl ? [{ _id: 'legacy', url: exam.answerSheetUrl, type: exam.answerSheetType }] : []);

  const [active, setActive] = useState(sheets[0] || null);

  if (!sheets.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <h3 className="font-bold text-sm truncate">نموذج الإجابة — {exam.title}</h3>
          <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
        </div>

        {/* Sheet tabs (only when more than one) */}
        {sheets.length > 1 && (
          <div className="flex gap-2 px-4 py-2 border-b overflow-x-auto shrink-0">
            {sheets.map((s, i) => (
              <Button
                key={s._id || i}
                size="sm"
                variant={active?._id === s._id ? 'default' : 'outline'}
                className="shrink-0 text-xs h-8"
                onClick={() => setActive(s)}
              >
                {s.type === 'pdf' ? 'ملف PDF' : 'صورة'} {i + 1}
              </Button>
            ))}
          </div>
        )}

        {/* Viewer */}
        <div className="flex-1 overflow-hidden">
          {active && <SheetViewer url={active.url} type={active.type} key={active._id} />}
        </div>
      </div>
    </div>
  );
}

/** Renders one sheet — Google Docs Viewer for PDF (same as online page), image inline */
function SheetViewer({ url, type }) {
  if (type === 'pdf') {
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0"
        title="نموذج الإجابة"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    );
  }
  return (
    <div className="h-full overflow-auto flex items-center justify-center bg-muted/20 p-4">
      <img
        src={url}
        alt="نموذج الإجابة"
        className="max-w-full max-h-full object-contain rounded shadow"
        onContextMenu={e => e.preventDefault()}
        draggable={false}
      />
    </div>
  );
}


function ExamInterface({ exam, onSubmitted, onClose }) {
  const [answers,   setAnswers]   = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [timeLeft,  setTimeLeft]  = useState(exam.duration ? exam.duration * 60 : null);
  const startTime = React.useRef(Date.now());

  // Timer
  useEffect(() => {
    if (!timeLeft) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const pick = (qId, optIdx) => setAnswers(p => ({ ...p, [qId]: optIdx }));

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !window.confirm('هل أنت متأكد من تسليم الامتحان؟ لن تستطيع التعديل بعد ذلك.')) return;
    setSubmitting(true);
    try {
      const answerArr = exam.questions.map(q => ({
        questionId:    q._id,
        chosenAnswer:  answers[q._id] ?? null,
      }));
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      const res = await api.post(`/exams/${exam._id}/submit`, { answers: answerArr, timeTakenSeconds: elapsed });
      toast.success('تم تسليم الامتحان وتصحيحه تلقائياً ✓');
      onSubmitted(res.data.data.submission);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل التسليم');
    } finally { setSubmitting(false); }
  };

  const answered   = Object.keys(answers).length;
  const total      = exam.questions.length;
  const unanswered = total - answered;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b bg-card px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold truncate text-sm sm:text-base">{exam.title}</h2>
          <p className="text-xs text-muted-foreground">{answered} / {total} سؤال تمت الإجابة عليه</p>
        </div>
        {timeLeft !== null && (
          <div className={`font-mono font-black text-lg px-3 py-1 rounded-xl ${
            timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' :
            timeLeft < 300 ? 'bg-orange-100 text-orange-600' :
            'bg-muted text-foreground'
          }`}>
            {formatTime(timeLeft)}
          </div>
        )}
        {/* Progress bar */}
        <div className="hidden sm:block w-32 bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(answered/total)*100}%` }} />
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5 pb-28">
          {exam.questions.map((q, idx) => {
            const chosen = answers[q._id] ?? null;
            return (
              <div key={q._id} className={`rounded-2xl border-2 p-4 sm:p-5 space-y-4 transition-all ${
                chosen !== null ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              }`}>
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    chosen !== null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>{idx+1}</span>
                  <div className="flex-1">
                    <p className="font-semibold leading-relaxed">{q.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {q.type === 'truefalse' ? 'صح / خطأ' : 'اختيار من متعدد'}
                      {' · '}{q.points} {q.points === 1 ? 'درجة' : 'درجات'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-11">
                  {q.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => pick(q._id, oIdx)}
                      className={`text-right px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${
                        chosen === oIdx
                          ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ml-2 ${
                        chosen === oIdx ? 'bg-white/20' : 'bg-muted'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom submit bar */}
      <div className="border-t bg-card px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
        {unanswered > 0 && (
          <p className="text-sm text-orange-600 font-medium">
            {unanswered} سؤال لم تجب عليه
          </p>
        )}
        <Button
          size="lg"
          className="mr-auto gap-2 px-8"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          {submitting ? 'جاري التسليم...' : 'تسليم الامتحان'}
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentExamsPage() {
  const { user } = useAuth();
  const [exams,    setExams]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [taking,   setTaking]   = useState(null); // exam being taken
  const [result,   setResult]   = useState(null); // { exam, submission }
  const [viewingAnswerSheets, setViewingAnswerSheets] = useState(null); // exam
  const [viewingPaperFile, setViewingPaperFile] = useState(null); // exam

  const load = useCallback(async () => {
    try {
      const d = await api.get('/exams', { params: { year: user?.academicYear, status: 'published' } });
      setExams(d.data.data.exams || []);
    } catch { toast.error('فشل تحميل الامتحانات'); }
    finally { setLoading(false); }
  }, [user]);

  // Load my results for each exam
  const [submissions, setSubmissions] = useState({});
  const loadSubmissions = useCallback(async (examList) => {
    const results = {};
    await Promise.allSettled(
      examList.map(async (e) => {
        try {
          const r = await api.get(`/exams/${e._id}/my-result`);
          results[e._id] = r.data.data.submission;
        } catch {}
      })
    );
    setSubmissions(results);
  }, []);

  useEffect(() => {
    load().then(() => {});
  }, [load]);

  useEffect(() => {
    if (exams.length > 0) loadSubmissions(exams);
  }, [exams, loadSubmissions]);

  const handleSubmitted = (submission) => {
    setSubmissions(p => ({ ...p, [taking._id]: submission }));
    const examData = taking;
    setTaking(null);
    setResult({ exam: examData, submission });
  };

  if (taking) {
    return <ExamInterface exam={taking} onSubmitted={handleSubmitted} onClose={() => setTaking(null)} />;
  }

  return (
    <>
      <Helmet><title>الامتحانات | منصة الطالب</title></Helmet>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-extrabold">الامتحانات</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {YEAR_LABELS[user?.academicYear] || ''}
            {!loading && ` — ${exams.length} امتحان متاح`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground font-medium">لا توجد امتحانات متاحة حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map(exam => {
              const sub    = submissions[exam._id];
              const done   = !!sub;
              const passed = done && sub.percentage >= 50;

              return (
                <Card key={exam._id} className={`border shadow-sm overflow-hidden transition-all ${done ? 'opacity-90' : 'hover:shadow-md'}`}>
                  <CardContent className="p-0">
                    <div className={`h-1.5 ${done ? (passed ? 'bg-green-500' : 'bg-red-400') : 'bg-primary/30'}`} />
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base">{exam.title}</h3>
                            {exam.examType === 'paper' && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700">ورقي</span>
                            )}
                          {done && exam.examType !== 'paper' && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                              }`}>
                                {passed ? `${sub.percentage}% ✓` : `${sub.percentage}% ✗`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                            {exam.questions?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5" />{exam.questions.length} سؤال
                              </span>
                            )}
                            {exam.maxScore > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5" />{exam.maxScore} درجة
                              </span>
                            )}
                            {exam.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />{exam.duration} دقيقة
                              </span>
                            )}
                            {exam.examDate && (
                              <span>{new Date(exam.examDate).toLocaleDateString('ar-EG')}</span>
                            )}
                          </div>
                          {exam.description && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{exam.description}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          {exam.examType === 'paper' ? (
                            /* Paper exam — view file only */
                            <div className="flex flex-col gap-2">
                              {exam.paperFileUrl && (
                                <Button size="sm" className="gap-1.5 w-full" onClick={() => setViewingPaperFile(exam)}>
                                  <Eye className="h-4 w-4" /> عرض الامتحان
                                </Button>
                              )}
                              {(exam.answerSheets?.length || exam.answerSheetUrl) && (
                                <Button size="sm" variant="outline" className="gap-1.5 w-full text-xs h-8" onClick={() => setViewingAnswerSheets(exam)}>
                                  <Eye className="h-3.5 w-3.5" /> نموذج الإجابة
                                </Button>
                              )}
                            </div>
                          ) : done ? (
                            <>
                              <div className={`text-center rounded-xl px-3 py-2 ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
                                <p className={`text-xl font-black ${passed ? 'text-green-600' : 'text-red-500'}`}>
                                  {sub.score}/{sub.maxScore}
                                </p>
                                <p className="text-xs text-muted-foreground">درجتك</p>
                              </div>
                              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setResult({ exam, submission: sub })}>
                                <Eye className="h-3.5 w-3.5" /> مراجعة
                              </Button>
                            </>
                          ) : (
                            <Button
                              className="gap-1.5 shadow-md"
                              onClick={() => setTaking(exam)}
                              disabled={!exam.questions?.length}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              ابدأ الامتحان
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Answer sheet */}
                      {(exam.answerSheets?.length || exam.answerSheetUrl) && done && (
                        <div className="mt-3 pt-3 border-t">
                          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs w-full" onClick={() => setViewingAnswerSheets(exam)}>
                            <Eye className="h-3.5 w-3.5" /> عرض نموذج الإجابة الرسمي
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {result && (
        <ResultModal
          exam={result.exam}
          submission={result.submission}
          onClose={() => setResult(null)}
        />
      )}

      {viewingAnswerSheets && (
        <AnswerSheetsModal
          exam={viewingAnswerSheets}
          onClose={() => setViewingAnswerSheets(null)}
        />
      )}

      {viewingPaperFile && (
        <FileViewerModal
          url={viewingPaperFile.paperFileUrl}
          type={viewingPaperFile.paperFileType}
          title={`الامتحان — ${viewingPaperFile.title}`}
          onClose={() => setViewingPaperFile(null)}
        />
      )}
    </>
  );
}