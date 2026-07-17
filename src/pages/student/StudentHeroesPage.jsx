import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Medal, Loader2, ChevronLeft, FolderOpen, Image, Star, Eye, ZoomIn, X, Sparkles } from 'lucide-react';
import { heroesAPI } from '@/api/services';
import api from '@/api/axios';

// --- مكون عرض الألبوم وصوره بعد إعادة التصميم الجذري (Cinematic Design System) ---
function AlbumView({ album, onBack }) {
  // state مخصصة لفتح الصورة ملء الشاشة (Lightbox)
  const [zoomedPhoto, setZoomedPhoto] = useState(null);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500 rtl">
      {/* شريط ملاحة علوي عصري ونظيف جداً */}
      <div className="flex items-center justify-between border-b border-border/40 pb-6">
        <button 
          onClick={onBack} 
          className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all px-5 py-2.5 rounded-full bg-secondary/50 hover:bg-secondary border border-border/60"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          العودة للألبومات رئيسية
        </button>

        <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full text-xs font-bold text-primary">
          <Image className="h-3.5 w-3.5" />
          <span>{album.photos?.length || 0} لقطة ملهمة</span>
        </div>
      </div>

      {/* هيدر الألبوم الجديد: تصميم غير متماثل مستوحى من المجلات الفاخرة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-2 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-amber-500 text-[11px] uppercase tracking-widest font-black">
            <Sparkles className="h-3.5 w-3.5 fill-amber-500/20" /> معرض التميز الشرفي
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
            {album.title}
          </h1>
        </div>
        {album.description && (
          <div className="md:col-span-1 border-r-2 border-primary/20 pr-4 py-1">
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line font-medium">
              {album.description}
            </p>
          </div>
        )}
      </div>

      {/* عرض الصور بتوزيع شبكي حديث وعريض (Bento-Inspired Layout) بدلاً من الميسونري العادي */}
      {!album.photos?.length ? (
        <div className="text-center py-24 rounded-3xl bg-seconday/30 border border-dashed border-border flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Image className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-muted-foreground font-semibold text-sm">لم يتم إضافة لقطات لهذا الألبوم الشرفي بعد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {album.photos.map((photo, index) => (
            <div 
              key={photo._id} 
              onClick={() => setZoomedPhoto(photo)}
              className={`group relative cursor-zoom-in overflow-hidden rounded-2xl border border-border/50 bg-secondary/20 shadow-xs transition-all duration-500 hover:shadow-2xl hover:border-border-strong ${
                index % 4 === 0 ? 'sm:col-span-2 sm:row-span-1 aspect-[21/9]' : 'aspect-square'
              }`}
            >
              <img 
                src={photo.url} 
                alt={photo.caption || ''} 
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 filter grayscale-[20%] group-hover:grayscale-0" 
              />
              
              {/* واجهة تحكم زجاجية عائمة تظهر بنعومة فائقة عند الحوم (Hover) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-between">
                <div className="flex justify-end">
                  <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center border border-white/20 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <ZoomIn className="h-4 w-4" />
                  </span>
                </div>
                
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {photo.caption ? (
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                      <p className="text-white text-xs font-bold leading-relaxed text-right">
                        {photo.caption}
                      </p>
                    </div>
                  ) : (
                    <p className="text-white/90 text-xs font-bold text-right flex items-center gap-1.5 justify-end">
                      <Eye className="h-4 w-4" /> تكبير واستعراض اللقطة
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- شاشة العرض الكاملة الفاخرة (Cinematic Lightbox Overlay) --- */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setZoomedPhoto(null)}
        >
          {/* زر الإغلاق الطائر */}
          <button 
            onClick={() => setZoomedPhoto(null)}
            className="absolute top-6 right-6 bg-foreground/5 hover:bg-foreground/10 text-foreground p-3 rounded-full border border-border/40 transition-all z-50 hover:rotate-90 duration-300"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* حاوية الصورة مع الحفاظ على الأبعاد الأصيلة */}
          <div className="relative max-w-5xl max-h-[75vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-300">
            <img 
              src={zoomedPhoto.url} 
              alt="عرض سينمائي" 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-border/40 select-none"
            />
          </div>

          {/* نص الصورة السفلي بتصميم مخصص للأجهزة الحديثة */}
          {zoomedPhoto.caption && (
            <div className="mt-6 max-w-xl text-center bg-secondary/80 backdrop-blur-lg text-foreground px-6 py-3.5 rounded-full text-xs font-bold border border-border shadow-xl">
              {zoomedPhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- المكون الرئيسي مع الحفاظ التام والكامل على اللوجيك والأكواد الوظيفية الأصيلة ---
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
    <div className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto min-h-screen">
      <AlbumView album={viewing} onBack={() => setViewing(null)} />
    </div>
  );

  return (
    <>
      <Helmet><title>أبطال الإبداع</title></Helmet>
      <div className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-16 animate-in fade-in duration-500 rtl">
        
        {/* هيدر الصفحة الرئيسي الجديد: تيبوغرافي جريء وتوزيع أفقي فخم بدلاً من التوسيط التقليدي */}
        <div className="relative border-b border-border/50 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-amber-600">
              <Medal className="h-3 w-3" /> لوحة الشرف السنوية
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground">
              أبطال الإبداع
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base font-medium max-w-xl leading-relaxed">
              سجلٌّ خالد نُوثق فيه مسيرة التميز، وأجمل اللحظات والإنجازات الاستثنائية لأبطال الإبداع في عالم الرياضيات. ⭐
            </p>
          </div>

          {/* عنصر بصري تجريدي مكمل للتصميم الحديث يعطي انطباع النقاء */}
          <div className="hidden md:flex items-center gap-3 bg-secondary/40 border border-border/60 p-4 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs font-black">أكاديمية الإبداع</div>
              <div className="text-[10px] text-muted-foreground font-bold">تفكير متميز لمستقبل واعد</div>
            </div>
          </div>
        </div>

        {/* حالة التحميل الراقية */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary stroke-[1.5]" />
            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">جاري استدعاء لوحة الشرف...</span>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-24 border border-dashed rounded-3xl bg-secondary/10 flex flex-col items-center justify-center">
            <Medal className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground font-bold text-sm">لا توجد ألبومات شرف منشورة حالياً.</p>
          </div>
        ) : (
          /* شبكة الألبومات بتصميم كروت هندسي غير تقليدي (Premium Editorial Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((album) => (
              <button
                key={album._id}
                onClick={() => openAlbum(album)}
                className="group text-right focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-2xl flex flex-col h-full bg-transparent transition-all duration-300"
              >
                {/* غلاف الألبوم المنفصل هندسياً بروايا حادة ناعمة وتأثير زووم فاخر */}
                <div className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl bg-secondary border border-border/40 shadow-xs group-hover:shadow-xl transition-all duration-500">
                  {album.coverUrl ? (
                    <img 
                      src={album.coverUrl} 
                      alt={album.title} 
                      className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 filter contrast-[95%]" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-secondary/50 to-secondary">
                      <FolderOpen className="h-10 w-10 text-muted-foreground/40 group-hover:text-amber-500/60 transition-colors" />
                      <span className="text-[10px] text-muted-foreground font-black tracking-widest uppercase bg-muted px-2.5 py-1 rounded-md border border-border/40">ALBUM</span>
                    </div>
                  )}
                  
                  {/* بادج عائم ناصع وشفاف لعدد الصور موجه لليسار */}
                  <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-lg text-foreground text-[10px] font-black px-3 py-1.5 rounded-full border border-border/60 shadow-sm flex items-center gap-1.5">
                    <Image className="h-3 w-3" />
                    <span>{album.photoCount || 0} صورة</span>
                  </div>
                </div>

                {/* تفاصيل الكرت بالأسفل بتنظيم متباعد ومقروئية عالية جداً */}
                <div className="pt-5 pb-2 px-1 flex-1 flex flex-col justify-between space-y-3 w-full">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
                      <span className="text-[10px] font-black tracking-widest uppercase">قصة إنجاز</span>
                    </div>
                    
                    <h3 className="font-black text-xl text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
                      {album.title}
                    </h3>
                    
                    {album.description && (
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">
                        {album.description}
                      </p>
                    )}
                  </div>

                  {/* رابط إجراء تصفح مبسط وأنيق يظهر كأنه تصفح مجلة */}
                  <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                    <span>استكشاف المعرض</span>
                    <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
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