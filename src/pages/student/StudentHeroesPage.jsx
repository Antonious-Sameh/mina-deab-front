import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Medal, Loader2, ChevronLeft, FolderOpen, Image, Star, Eye, ZoomIn, X, Sparkles } from 'lucide-react';
import { heroesAPI } from '@/api/services';
import api from '@/api/axios';

// --- مكون عرض الألبوم وصوره بعد التعديل الفخم ---
function AlbumView({ album, onBack }) {
  // state مخصصة لفتح الصورة ملء الشاشة (Lightbox)
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* زر الرجوع بتصميم أنيق */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-all px-4 py-2 rounded-xl bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20"
        >
          <ChevronLeft className="h-4 w-4" /> رجوع للألبومات
        </button>
      </div>

      {/* هيدر الألبوم */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-bold">
          <Sparkles className="h-3 w-3" /> ألبوم الصور الذكارية
        </div>
        <h2 className="text-3xl font-black tracking-tight">{album.title}</h2>
        {album.description && (
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{album.description}</p>
        )}
        <div className="pt-2">
          <span className="inline-flex items-center bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-lg">
            {album.photos?.length || 0} صورة
          </span>
        </div>
      </div>

      {/* عرض الصور */}
      {!album.photos?.length ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">لا توجد صور في هذا الألبوم بعد</p>
        </div>
      ) : (
        /* شبكة صور الـ Masonry بشكل فخم */
        <div className="columns-2 sm:columns-3 gap-4 space-y-4">
          {album.photos.map(photo => (
            <div 
              key={photo._id} 
              onClick={() => setZoomedPhoto(photo)}
              className="break-inside-avoid rounded-2xl overflow-hidden border border-border/80 bg-card shadow-sm group relative cursor-zoom-in hover:border-primary/40 hover:shadow-xl transition-all duration-300"
            >
              <img 
                src={photo.url} 
                alt={photo.caption || ''} 
                className="w-full object-cover group-hover:scale-[1.03] transition-transform duration-500 rounded-2xl" 
              />
              
              {/* Overlay احترافي يظهر عند الهوفر */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <span className="bg-white/20 backdrop-blur-md text-white p-1.5 rounded-lg shadow-sm">
                    <ZoomIn className="h-4 w-4" />
                  </span>
                </div>
                {photo.caption ? (
                  <p className="text-white text-xs font-medium leading-relaxed bg-black/40 backdrop-blur-xs p-2 rounded-xl text-right">
                    {photo.caption}
                  </p>
                ) : (
                  <p className="text-white/80 text-[11px] font-medium text-right flex items-center gap-1 justify-end">
                    <Eye className="h-3.5 w-3.5" /> عرض الصورة كاملة
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- شاشة عرض كاملة للصورة ملء الشاشة (Lightbox) عند الضغط --- */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedPhoto(null)}
        >
          {/* زر الإغلاق */}
          <button 
            onClick={() => setZoomedPhoto(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-50"
          >
            <X className="h-6 w-6" />
          </button>
          
          {/* الصورة الكبيرة */}
          <img 
            src={zoomedPhoto.url} 
            alt="عرض كامل" 
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl select-none animate-in zoom-in-95 duration-200"
          />

          {/* الكابشن أسفل الصورة الكبيرة إن وجد */}
          {zoomedPhoto.caption && (
            <div className="mt-4 max-w-xl text-center bg-white/10 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-sm font-medium border border-white/10">
              {zoomedPhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- المكون الرئيسي مع الحفاظ التام على اللوجيك الأصلي وبنفس التسمية ---
export default function StudentHeroesPage() {
  const [albums,  setAlbums]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    heroesAPI.getAll().then(d => setAlbums(d.albums || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openAlbum = async (album) => {
    try { const r = await api.get(`/heroes/${album._id}`); setViewing(r.data.data.album); }
    catch { setViewing(album); }
  };

  if (viewing) return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <AlbumView album={viewing} onBack={() => setViewing(null)} />
    </div>
  );

  return (
    <>
      <Helmet><title>أبطال الإبداع</title></Helmet>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* هيدر الصفحة الرئيسي بتصميم فخم يليق بالأبطال */}
        <div className="text-center space-y-3 py-6 relative overflow-hidden rounded-3xl bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent border border-yellow-500/10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md shadow-yellow-500/20 mb-1 animate-bounce duration-[3s]">
            <Medal className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-l from-amber-600 to-yellow-500 bg-clip-text text-transparent">
            أبطال الإبداع
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-md mx-auto">
            هنا بنحتفظ بأجمل لحظات وإنجازات أبطال الإبداع في الرياضيات. ⭐
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-muted/20">
            <Medal className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">لا توجد ألبومات شرف بعد</p>
          </div>
        ) : (
          /* شبكة عرض الألبومات المحسنة بالكامل */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <button
                key={album._id}
                onClick={() => openAlbum(album)}
                className="group text-right rounded-3xl overflow-hidden border border-border/80 bg-card shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 flex flex-col h-full"
              >
                {/* غلاف الألبوم */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border-b shrink-0">
                  {album.coverUrl ? (
                    <img 
                      src={album.coverUrl} 
                      alt={album.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <FolderOpen className="h-14 w-14 text-amber-400/80" />
                      <span className="text-xs text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">ألبوم صور</span>
                    </div>
                  )}
                  
                  {/* بادج عدد الصور المطور */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-xl font-bold border border-white/10 shadow-sm flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    {album.photoCount || 0} صورة
                  </div>

                  {/* تأثير ظل ناعم عند الهوفر */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 justify-end">
                    <span className="bg-white text-foreground text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      تصفح الألبوم <ChevronLeft className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* تفاصيل الألبوم بالأسفل */}
                <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star className="h-4 w-4 fill-amber-500" />
                      <span className="text-[10px] font-bold tracking-wider uppercase">قصة نجاح</span>
                    </div>
                    <p className="font-extrabold text-lg text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                      {album.title}
                    </p>
                    {album.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {album.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}