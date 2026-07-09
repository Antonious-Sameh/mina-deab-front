/**
 * PDFViewer.jsx
 * Renders a PDF file page-by-page on HTML canvas using PDF.js.
 *
 * No browser PDF toolbar → no download button, no print button.
 * PDF.js fetches the URL directly (no credentials — Cloudinary files are public reads).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Lazy singleton: load PDF.js once ─────────────────────────────────────────
let _pdfjsLib = null;
async function getPdfjsLib() {
  if (_pdfjsLib) return _pdfjsLib;
  const mod = await import('pdfjs-dist');
  _pdfjsLib = mod;
  // Worker must be set before any getDocument() call
  _pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  return _pdfjsLib;
}

/**
 * Normalise Cloudinary PDF URLs so they:
 *  1. Use /image/upload/ (not /raw/upload/) — raw blocks CORS reads
 *  2. Include fl_attachment:false — prevents browser from triggering a download
 *
 * Safe for non-Cloudinary URLs (returns unchanged).
 */
function normalizeUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url
    .replace('/raw/upload/', '/image/upload/')                  // raw → image (CORS fix)
    .replace(/\/fl_attachment(?::[^/]+)?/g, '')                 // remove any existing flag
    .replace('/image/upload/', '/image/upload/fl_attachment:false/'); // force no-attachment
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PDFViewer({ url }) {
  const [pdf,         setPdf]         = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(0);
  const [scale,       setScale]       = useState(1.3);
  const [status,      setStatus]      = useState('loading'); // loading | ready | error
  const [pageLoading, setPageLoading] = useState(false);
  const canvasRef       = useRef(null);
  const renderTaskRef   = useRef(null);

  // ── Load the PDF document ────────────────────────────────────────────────
  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setPdf(null);
      setCurrentPage(1);
      setTotalPages(0);

      try {
        const pdfjs = await getPdfjsLib();
        const normalized = normalizeUrl(url);

        // Pass URL directly to PDF.js — it fetches internally without credentials.
        // Cloudinary public assets allow anonymous cross-origin reads.
        const loadingTask = pdfjs.getDocument({
          url: normalized,
          withCredentials: false,
        });

        const doc = await loadingTask.promise;
        if (cancelled) return;

        setPdf(doc);
        setTotalPages(doc.numPages);
        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          console.error('[PDFViewer] load error:', err);
          setStatus('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // ── Render one page to <canvas> ──────────────────────────────────────────
  const renderPage = useCallback(async (doc, pageNum, pageScale) => {
    if (!canvasRef.current || !doc) return;

    // Cancel any in-progress render to avoid "rendering cancelled" spam
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
      renderTaskRef.current = null;
    }

    setPageLoading(true);
    try {
      const page     = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: pageScale });
      const canvas   = canvasRef.current;
      const ctx      = canvas.getContext('2d');

      // HiDPI / Retina sharpness
      const dpr = window.devicePixelRatio || 1;
      canvas.width        = viewport.width  * dpr;
      canvas.height       = viewport.height * dpr;
      canvas.style.width  = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') {
        console.error('[PDFViewer] render error:', e);
      }
    } finally {
      setPageLoading(false);
      renderTaskRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (pdf && status === 'ready') renderPage(pdf, currentPage, scale);
  }, [pdf, currentPage, scale, status, renderPage]);

  const prev    = () => setCurrentPage(p => Math.max(1, p - 1));
  const next    = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const zoomIn  = () => setScale(s => Math.min(3,   +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)));

  // ── States ────────────────────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm">جاري تحميل الملف…</p>
    </div>
  );

  if (status === 'error') return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive p-6 text-center">
      <p className="font-medium">تعذّر تحميل الملف</p>
      <p className="text-xs text-muted-foreground">تأكد من اتصال الإنترنت وحاول مرة أخرى</p>
      <Button size="sm" variant="outline" className="mt-2"
        onClick={() => { setStatus('loading'); setPdf(null); }}>
        إعادة المحاولة
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-muted/30 shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={prev}
            disabled={currentPage <= 1 || pageLoading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[80px] text-center select-none">
            {currentPage} / {totalPages}
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={next}
            disabled={currentPage >= totalPages || pageLoading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={zoomOut}
            disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs min-w-[44px] text-center select-none text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={zoomIn}
            disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto flex justify-center items-start
                      bg-neutral-200 dark:bg-neutral-800 p-4">
        <div className="relative shadow-lg">
          {pageLoading && (
            <div className="absolute inset-0 flex items-center justify-center
                            bg-white/60 dark:bg-black/40 rounded z-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {/* onContextMenu blocked → prevents right-click "Save image as…" */}
          <canvas
            ref={canvasRef}
            className="block rounded"
            onContextMenu={e => e.preventDefault()}
          />
        </div>
      </div>
    </div>
  );
}