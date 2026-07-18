import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  Medal, Plus, Edit, Trash2, Loader2, X, Save,
  Image, Upload, ChevronLeft, FolderOpen, Camera
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { heroesAPI } from '@/api/services';
import api from '@/api/axios';
import { toast } from 'sonner';

// ── Album Form Modal ──────────────────────────────────────────────────────────
function AlbumModal({ album, onClose, onSaved }) {
  const isEdit = !!album;
  const [title, setTitle] = useState(album?.title || '');
  const [desc,  setDesc]  = useState(album?.description || '');
  const [saving,setSaving]= useState(false);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('اسم الألبوم مطلوب'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/heroes/${album._id}`, { title: title.trim(), description: desc.trim() || null });
        toast.success('تم تعديل الألبوم');
      } else {
        await api.post('/heroes', { title: title.trim(), description: desc.trim() || null });
        toast.success('تم إنشاء الألبوم ✓');
      }
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.message || 'فشلت العملية'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">{isEdit ? 'تعديل الألبوم' : 'إنشاء ألبوم جديد'}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>اسم الألبوم <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: أبطال 3 إعدادي 2025" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>وصف (اختياري)</Label>
            <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="وصف الألبوم..." />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Photo Upload Modal ────────────────────────────────────────────────────────
function UploadModal({ albumId, onClose, onSaved }) {
  const [files,    setFiles]    = useState([]);
  const [captions, setCaptions] = useState([]);
  const [uploading,setUploading]= useState(false);
  const [previews, setPreviews] = useState([]);
  const fileRef = React.useRef(null);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setCaptions(selected.map(() => ''));
  };

  // Create object URLs once per file-selection (not on every render/keystroke),
  // and revoke them on cleanup — previously URL.createObjectURL(f) was called
  // inline in JSX, so every re-render (e.g. typing a caption) leaked a new
  // blob URL for every selected file that was never released.
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, [files]);

  const handleUpload = async () => {
    if (!files.length) { toast.error('اختر صورة واحدة على الأقل'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('photos', f));
      captions.forEach(c => fd.append('captions', c));
      await api.post(`/heroes/${albumId}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`تم رفع ${files.length} صورة ✓`);
      onSaved();
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل الرفع'); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">إضافة صور للألبوم</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5 space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
          >
            <Camera className="h-10 w-10 text-primary/40 mx-auto mb-3" />
            <p className="font-medium">{files.length > 0 ? `${files.length} صورة مختارة` : 'اضغط لاختيار الصور'}</p>
            <p className="text-xs text-muted-foreground mt-1">يمكنك اختيار أكثر من صورة في آن واحد</p>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />

          {files.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg p-2">
                  <img src={previews[i]} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  <Input
                    value={captions[i] || ''}
                    onChange={e => setCaptions(p => { const n=[...p]; n[i]=e.target.value; return n; })}
                    placeholder={`اسم أو وصف (اختياري)`}
                    className="h-8 text-sm flex-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={uploading}>إلغاء</Button>
          <Button className="flex-1 gap-2" onClick={handleUpload} disabled={uploading || !files.length}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'جاري الرفع...' : `رفع ${files.length || ''} صورة`}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Album Detail View ─────────────────────────────────────────────────────────
function AlbumView({ album, onBack, onUpdated }) {
  const [data,    setData]    = useState(album);
  const [loading, setLoading] = useState(false);
  const [upload,  setUpload]  = useState(false);

  const reload = async () => {
    const r = await api.get(`/heroes/${album._id}`);
    setData(r.data.data.album);
    onUpdated();
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('حذف هذه الصورة؟')) return;
    try {
      await api.delete(`/heroes/${album._id}/photos/${photoId}`);
      toast.success('تم حذف الصورة');
      reload();
    } catch { toast.error('فشل الحذف'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" /> رجوع
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold">{data.title}</h2>
          {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
        </div>
        <Button className="gap-2" onClick={() => setUpload(true)}>
          <Plus className="h-4 w-4" /> إضافة صور
        </Button>
      </div>

      {data.photos?.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">لا توجد صور — اضغط "إضافة صور"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.photos.map(photo => (
            <div key={photo._id} className="group relative rounded-xl overflow-hidden border bg-muted aspect-square">
              <img src={photo.url} alt={photo.caption || ''} loading="lazy" className="w-full h-full object-cover" />
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs px-2 py-1 text-center truncate">
                  {photo.caption}
                </div>
              )}
              <button
                onClick={() => handleDeletePhoto(photo._id)}
                className="absolute top-2 left-2 w-7 h-7 bg-red-500 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {upload && (
        <UploadModal albumId={album._id} onClose={() => setUpload(false)} onSaved={() => { setUpload(false); reload(); }} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HeroesPage() {
  const [albums,  setAlbums]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await heroesAPI.getAll();
      setAlbums(d.albums || []);
    } catch { toast.error('فشل تحميل الألبومات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (album) => {
    if (!window.confirm(`حذف ألبوم "${album.title}" وكل صوره؟`)) return;
    try {
      await api.delete(`/heroes/${album._id}`);
      toast.success('تم حذف الألبوم');
      load();
    } catch { toast.error('فشل الحذف'); }
  };

  if (viewing) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <AlbumView album={viewing} onBack={() => { setViewing(null); load(); }} onUpdated={load} />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>أبطال مروا من هنا | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">أبطال مروا من هنا</h2>
            <p className="text-muted-foreground text-sm">{loading ? '...' : `${albums.length} ألبوم`}</p>
          </div>
          <Button className="gap-2" onClick={() => setModal('create')}>
            <Plus className="h-5 w-5" /> ألبوم جديد
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl">
            <Medal className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-bold">لا توجد ألبومات بعد</h3>
            <p className="text-muted-foreground text-sm mt-1">أنشئ أول ألبوم لأبطالك</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map(album => (
              <Card key={album._id} className="border shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group" onClick={() => setViewing(album)}>
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {album.coverUrl ? (
                    <img src={album.coverUrl} alt={album.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <FolderOpen className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {album.photoCount || 0} صورة
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{album.title}</p>
                      {album.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{album.description}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setModal({ album })}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(album)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {modal === 'create' && <AlbumModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.album        && <AlbumModal album={modal.album} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </>
  );
}