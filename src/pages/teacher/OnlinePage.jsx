import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  MonitorPlay,
  Users,
  BarChart2,
  X,
  Save,
  ChevronLeft,
  GripVertical,
  Play,
  Image,
  FileText,
  AlignLeft,
  Upload,
  Youtube,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lessonsAPI } from "@/api/services";
import api from "@/api/axios";
import { toast } from "sonner";

const ACADEMIC_YEARS = [
  { value: "first-prep", label: "الصف الأول الإعدادي" },
  { value: "second-prep", label: "الصف الثاني الإعدادي" },
  { value: "third-prep", label: "الصف الثالث الإعدادي" },
  { value: "first-sec", label: "الصف الأول الثانوي" },
  { value: "second-sec", label: "الصف الثاني الثانوي" },
  { value: "third-sec",  label: "الصف الثالث الثانوي" },
];
const YEAR_MAP = Object.fromEntries(
  ACADEMIC_YEARS.map((y) => [y.value, y.label]),
);

function isYouTube(url) {
  return url && (url.includes("youtube.com") || url.includes("youtu.be"));
}

// ── Content type icons & labels ───────────────────────────────────────────────
const TYPE_INFO = {
  video: { icon: Play, label: "فيديو", color: "text-red-500", bg: "bg-red-50" },
  image: {
    icon: Image,
    label: "صورة",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  pdf: {
    icon: FileText,
    label: "PDF",
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  article: {
    icon: AlignLeft,
    label: "مقال/شرح",
    color: "text-green-500",
    bg: "bg-green-50",
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// ADD CONTENT MODAL
// ══════════════════════════════════════════════════════════════════════════════
function AddContentModal({ lessonId, onClose, onAdded }) {
  const [tab, setTab] = useState("video");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // video
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  // image
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  // pdf
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfName, setPdfName] = useState("");
  // article
  const [artTitle, setArtTitle] = useState("");
  const [artBody, setArtBody] = useState("");

  const fileRef = useRef(null);

  const uploadFile = async (file, type) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.post(`/lessons/${lessonId}/items/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = r.data.data.url;
      if (type === "image") {
        setImageUrl(url);
        if (!caption) setCaption(file.name.split(".")[0]);
      }
      if (type === "pdf") {
        setPdfUrl(url);
        if (!pdfName) setPdfName(file.name);
      }
      toast.success("تم رفع الملف ✓");
    } catch {
      toast.error("فشل رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload = { type: tab };
      if (tab === "video") {
        if (!videoUrl.trim()) {
          toast.error("أدخل رابط الفيديو");
          setSaving(false);
          return;
        }
        payload = {
          ...payload,
          videoUrl: videoUrl.trim(),
          duration: duration.trim() || null,
        };
      }
      if (tab === "image") {
        if (!imageUrl) {
          toast.error("ارفع صورة أولاً");
          setSaving(false);
          return;
        }
        payload = {
          ...payload,
          imageUrl,
          imageCaption: caption.trim() || null,
        };
      }
      if (tab === "pdf") {
        if (!pdfUrl) {
          toast.error("ارفع ملف PDF");
          setSaving(false);
          return;
        }
        payload = { ...payload, pdfUrl, pdfName: pdfName.trim() || null };
      }
      if (tab === "article") {
        if (!artBody.trim()) {
          toast.error("اكتب محتوى المقال");
          setSaving(false);
          return;
        }
        payload = {
          ...payload,
          title: artTitle.trim() || null,
          body: artBody.trim(),
        };
      }
      await lessonsAPI.addItem(lessonId, payload);
      toast.success("تم إضافة المحتوى ✓");
      onAdded();
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشلت العملية");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">إضافة محتوى</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="w-full rounded-none border-b grid grid-cols-4">
            {Object.entries(TYPE_INFO).map(([k, v]) => (
              <TabsTrigger key={k} value={k} className="gap-1.5 text-xs py-2.5">
                <v.icon className={`h-4 w-4 ${v.color}`} />
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Video */}
          <TabsContent value="video" className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                {isYouTube(videoUrl) ? (
                  <>
                    <Youtube className="h-4 w-4 text-red-500" />
                    رابط YouTube
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    رابط الفيديو
                  </>
                )}
              </Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... أو رابط Cloudinary"
                dir="ltr"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>مدة الفيديو (اختياري)</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="مثال: 45:30"
              />
            </div>
          </TabsContent>

          {/* Image */}
          <TabsContent value="image" className="p-5 space-y-4">
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full max-h-48 object-contain rounded-xl border bg-muted"
                />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                ) : (
                  <>
                    <Image className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      اضغط لرفع صورة
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadFile(e.target.files?.[0], "image")}
            />
            <div className="space-y-1.5">
              <Label>وصف الصورة (اختياري)</Label>
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="مثال: خريطة مصر"
              />
            </div>
          </TabsContent>

          {/* PDF */}
          <TabsContent value="pdf" className="p-5 space-y-4">
            {pdfUrl ? (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                <FileText className="h-8 w-8 text-orange-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">
                    {pdfName || "ملف PDF"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    تم الرفع بنجاح
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPdfUrl("");
                    setPdfName("");
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-orange-400 mx-auto" />
                ) : (
                  <>
                    <FileText className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      اضغط لرفع ملف PDF
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => uploadFile(e.target.files?.[0], "pdf")}
            />
            <div className="space-y-1.5">
              <Label>اسم الملف</Label>
              <Input
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="مثال: مذكرة الفصل الأول"
              />
            </div>
          </TabsContent>

          {/* Article */}
          <TabsContent value="article" className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label>عنوان المقال (اختياري)</Label>
              <Input
                value={artTitle}
                onChange={(e) => setArtTitle(e.target.value)}
                placeholder="مثال: ملخص الدرس"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                المحتوى <span className="text-destructive">*</span>
              </Label>
              <textarea
                value={artBody}
                onChange={(e) => setArtBody(e.target.value)}
                rows={8}
                placeholder="اكتب الشرح أو الملخص هنا..."
                className="w-full border rounded-xl px-4 py-3 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 p-5 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {saving ? "جاري الإضافة..." : "إضافة"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LESSON DETAIL VIEW (teacher)
// ══════════════════════════════════════════════════════════════════════════════
function LessonDetail({ lesson: initLesson, onBack }) {
  const [lesson, setLesson] = useState(initLesson);
  const [addModal, setAddModal] = useState(false);
  const [viewers, setViewers] = useState(null);
  const [showView, setShowView] = useState(false);
  const [loading, setLoading] = useState(false);

  const reload = async () => {
    const r = await api.get(`/lessons/${lesson._id}`);
    setLesson(r.data.data.lesson);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('حذف هذا المحتوى؟')) return;
    try {
      await lessonsAPI.deleteItem(lesson._id, itemId);
      toast.success('تم الحذف');
      reload();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل الحذف');
    }
  };

  const move = async (items, idx, dir) => {
    const arr = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    const order = arr.map((it, i) => ({ itemId: it._id, order: i }));
    try {
      await lessonsAPI.reorderItems(lesson._id, order);
      reload();
    } catch {
      toast.error("فشل تغيير الترتيب");
    }
  };

  const loadViewers = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/lessons/${lesson._id}/viewers`);
      setViewers(r.data.data);
      setShowView(true);
    } catch {
      toast.error("فشل تحميل المشاهدات");
    } finally {
      setLoading(false);
    }
  };

  const sortedItems = [...(lesson.items || [])].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          رجوع
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold truncate">{lesson.title}</h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {YEAR_MAP[lesson.academicYear]}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${lesson.published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
            >
              {lesson.published ? "منشور" : "مسودة"}
            </span>
            <span className="text-xs text-muted-foreground">
              {sortedItems.length} محتوى
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={async () => {
              await api.patch(`/lessons/${lesson._id}/publish`);
              toast.success(lesson.published ? "تم الإخفاء" : "تم النشر");
              reload();
            }}
          >
            {lesson.published ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                إخفاء
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                نشر
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs border-blue-300 text-blue-600"
            onClick={loadViewers}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BarChart2 className="h-3.5 w-3.5" />
            )}{" "}
            المشاهدات
          </Button>
          <Button
            className="gap-1.5 h-8 text-xs"
            onClick={() => setAddModal(true)}
          >
            <Plus className="h-4 w-4" />
            إضافة محتوى
          </Button>
        </div>
      </div>

      {/* Viewers panel — full tracking details */}
      {showView && viewers && (
        <Card className="border shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
            <p className="font-semibold text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" /> تفاصيل متابعة
              المشاهدة{" "}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowView(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-0 text-center border-b">
            {[
              {
                label: "إجمالي",
                value: viewers.summary.total,
                cls: "bg-muted/20",
              },
              {
                label: "بدأوا",
                value: viewers.summary.watched,
                cls: "bg-blue-50 text-blue-700",
              },
              {
                label: "أكملوا",
                value: viewers.summary.completed,
                cls: "bg-green-50 text-green-700",
              },
              {
                label: "لم يشاهدوا",
                value: viewers.summary.notWatched,
                cls: "bg-red-50 text-red-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`py-3 border-l last:border-l-0 ${s.cls}`}
              >
                {" "}
                <p className="text-xl font-black">{s.value}</p>{" "}
                <p className="text-xs opacity-70">{s.label}</p>{" "}
              </div>
            ))}{" "}
          </div>{" "}
          {/* Detailed table */}{" "}
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            {" "}
            <table className="w-full text-sm text-right">
              {" "}
              <thead className="bg-muted/20 text-muted-foreground text-xs sticky top-0">
                {" "}
                <tr>
                  {" "}
                  <th className="px-3 py-2">الطالب</th>{" "}
                  <th className="px-3 py-2 text-center">نسبة المشاهدة</th>{" "}
                  <th className="px-3 py-2 text-center">وقت المشاهدة</th>{" "}
                  <th className="px-3 py-2 text-center">الحالة</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y">
                {" "}
                {viewers.watched.map((s) => {
                  const mins = Math.floor((s.watchDuration || 0) / 60);
                  const secs = (s.watchDuration || 0) % 60;
                  const timeStr = mins > 0 ? `${mins}د ${secs}ث` : `${secs}ث`;
                  const pct = s.watchPercentage || 0;
                  return (
                    <tr key={s._id} className="hover:bg-green-50/30">
                      {" "}
                      <td className="px-3 py-2.5 font-bold">{s.name}</td>{" "}
                      <td className="px-3 py-2.5">
                        {" "}
                        <div className="flex items-center gap-2 justify-center">
                          {" "}
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            {" "}
                            <div
                              className={`h-1.5 rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />{" "}
                          </div>{" "}
                          <span
                            className={`text-xs font-bold ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500"}`}
                          >
                            {pct}%
                          </span>{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                        {timeStr}
                      </td>{" "}
                      <td className="px-3 py-2.5 text-center">
                        {" "}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                        >
                          {" "}
                          {s.completed ? "✓ مكتمل" : "جاري"}{" "}
                        </span>{" "}
                      </td>{" "}
                    </tr>
                  );
                })}{" "}
                {viewers.notWatched.map((s) => (
                  <tr key={s._id} className="hover:bg-red-50/20 opacity-60">
                    {" "}
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {s.name}
                    </td>{" "}
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                      —
                    </td>{" "}
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                      —
                    </td>{" "}
                    <td className="px-3 py-2.5 text-center">
                      {" "}
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                        لم يشاهد
                      </span>{" "}
                    </td>{" "}
                  </tr>
                ))}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </Card>
      )}

      {/* Content items */}
      {sortedItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground font-medium">لا يوجد محتوى بعد</p>
          <p className="text-xs text-muted-foreground mt-1">
            اضغط "إضافة محتوى" لبدء بناء الدرس
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item, idx) => {
            const info = TYPE_INFO[item.type] || TYPE_INFO.article;
            const Icon = info.icon;
            return (
              <div
                key={item._id}
                className="bg-card border rounded-xl overflow-hidden shadow-sm"
              >
                {/* Item header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-b">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${info.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${info.color}`} />
                  </div>
                  <span className="font-semibold text-sm flex-1">
                    {info.label} {idx + 1}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => move(sortedItems, idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => move(sortedItems, idx, 1)}
                      disabled={idx === sortedItems.length - 1}
                      className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Item preview */}
                <div className="p-4">
                  {item.type === "video" && (
                    <div className="flex items-center gap-3">
                      <Play className="h-5 w-5 text-red-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-muted-foreground truncate">
                          {item.videoUrl}
                        </p>
                        {item.duration && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            المدة: {item.duration}
                          </p>
                        )}
                      </div>
                      {isYouTube(item.videoUrl) && (
                        <Badge className="bg-red-100 text-red-700 border-0 text-xs shrink-0">
                          YouTube
                        </Badge>
                      )}
                    </div>
                  )}
                  {item.type === "image" && (
                    <div className="space-y-2">
                      <img
                        src={item.imageUrl}
                        alt={item.imageCaption || ""}
                        className="max-h-40 rounded-lg object-contain border bg-muted"
                      />
                      {item.imageCaption && (
                        <p className="text-xs text-muted-foreground">
                          {item.imageCaption}
                        </p>
                      )}
                    </div>
                  )}
                  {item.type === "pdf" && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-orange-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {item.pdfName || "ملف PDF"}
                        </p>
                      </div>
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          فتح
                        </Button>
                      </a>
                    </div>
                  )}
                  {item.type === "article" && (
                    <div className="space-y-1">
                      {item.title && <p className="font-bold">{item.title}</p>}
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {item.body}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addModal && (
        <AddContentModal
          lessonId={lesson._id}
          onClose={() => setAddModal(false)}
          onAdded={() => {
            setAddModal(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LESSON FORM MODAL
// ══════════════════════════════════════════════════════════════════════════════
function LessonModal({ lesson, onClose, onSaved }) {
  const isEdit = !!lesson;
  const [title, setTitle] = useState(lesson?.title || "");
  const [year, setYear] = useState(lesson?.academicYear || "");
  const [desc, setDesc] = useState(lesson?.description || "");
  const [pub, setPub] = useState(lesson?.published ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("عنوان الدرس مطلوب");
      return;
    }
    if (!year) {
      toast.error("المرحلة الدراسية مطلوبة");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await lessonsAPI.update(lesson._id, {
          title: title.trim(),
          description: desc.trim() || null,
          published: pub,
        });
        toast.success("تم تعديل الدرس");
      } else {
        await lessonsAPI.create({
          title: title.trim(),
          academicYear: year,
          description: desc.trim() || null,
          type: "video",
          published: pub,
        });
        toast.success("تم إنشاء الدرس ✓");
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || "فشلت العملية");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">{isEdit ? "تعديل الدرس" : "درس جديد"}</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>
              اسم الدرس <span className="text-destructive">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الدرس الأول — مقدمة"
              autoFocus
            />
          </div>
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>
                المرحلة الدراسية <span className="text-destructive">*</span>
              </Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>وصف الدرس (اختياري)</Label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="وصف مختصر..."
            />
          </div>
          <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
            <button
              type="button"
              onClick={() => setPub(!pub)}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative shrink-0 ${pub ? "bg-green-500" : "bg-muted-foreground/30"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${pub ? "right-0.5" : "left-0.5"}`}
              />
            </button>
            <div>
              <p className="text-sm font-medium">
                {pub ? "منشور للطلاب" : "مسودة (مخفي)"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function OnlinePage() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState("");
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await lessonsAPI.getAll(filterYear ? { year: filterYear } : {});
      setLessons(d.lessons || []);
    } catch {
      toast.error("فشل تحميل الدروس");
    } finally {
      setLoading(false);
    }
  }, [filterYear]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (lesson) => {
    const lessonId = lesson?._id || lesson?.id;
    
    if (!lessonId) {
      toast.error('تعذر تحديد الدرس — أعد تحميل الصفحة وحاول مرة أخرى');
      return;
    }

    if (!window.confirm(`حذف "${lesson.title}"؟`)) return;
    
    try {
      await lessonsAPI.remove(lessonId);
      toast.success('تم الحذف');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل الحذف');
    }
  };

  // Group by year — memoized so this only recomputes when `lessons` actually
  // changes, not on every render (e.g. opening/closing a modal).
  const byYear = useMemo(() => lessons.reduce((acc, l) => {
    if (!acc[l.academicYear]) acc[l.academicYear] = [];
    acc[l.academicYear].push(l);
    return acc;
  }, {}), [lessons]);

  if (viewing)
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <LessonDetail
          lesson={viewing}
          onBack={() => {
            setViewing(null);
            load();
          }}
        />
      </div>
    );

  return (
    <>
      <Helmet>
        <title>الأون لاين | نظام المعلم</title>
      </Helmet>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">الدروس الأون لاين</h2>
            <p className="text-muted-foreground text-sm">
              {loading ? "..." : `${lessons.length} درس`}
            </p>
          </div>
          <Button className="gap-2" onClick={() => setModal("create")}>
            <Plus className="h-5 w-5" />
            درس جديد
          </Button>
        </div>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="كل السنوات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">كل السنوات</SelectItem>
            {ACADEMIC_YEARS.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
            <MonitorPlay className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold">لا توجد دروس</h3>
          </div>
        ) : (
          <div className="space-y-6">
            {ACADEMIC_YEARS.filter((y) => byYear[y.value]).map((yr) => (
              <section
                key={yr.value}
                className="bg-card rounded-2xl border shadow-sm overflow-hidden"
              >
                <div className="bg-muted/30 px-5 py-3 border-b flex items-center gap-3">
                  <MonitorPlay className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">{yr.label}</h3>
                  <Badge variant="secondary" className="mr-auto">
                    {byYear[yr.value].length} درس
                  </Badge>
                </div>
                <div className="p-3 space-y-2">
                  {byYear[yr.value].map((lesson) => {
                    const itemCount = lesson.items?.length || 0;
                    const types = [
                      ...new Set((lesson.items || []).map((i) => i.type)),
                    ];
                    return (
                      <div
                        key={lesson._id}
                        className="flex items-center gap-3 bg-background border rounded-xl px-4 py-3 hover:shadow-sm cursor-pointer transition-all group"
                        onClick={() => setViewing(lesson)}
                      >
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${lesson.published ? "bg-green-500" : "bg-muted-foreground/40"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {lesson.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-48">
                                {lesson.description}
                              </span>
                            )}
                            <div className="flex gap-1">
                              {types.map((t) => {
                                const I = TYPE_INFO[t];
                                if (!I) return null;
                                return (
                                  <I.icon
                                    key={t}
                                    className={`h-3.5 w-3.5 ${I.color}`}
                                  />
                                );
                              })}
                            </div>
                            {itemCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {itemCount} محتوى
                              </span>
                            )}
                            <span
                              className={`text-xs ${lesson.published ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {lesson.published ? "منشور" : "مسودة"}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setModal({ lesson })}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(lesson)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {modal === "create" && (
        <LessonModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal?.lesson && (
        <LessonModal
          lesson={modal.lesson}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </>
  );
}