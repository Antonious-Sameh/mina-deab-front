/**
 * FileViewerModal.jsx
 * BUGFIX: was using Google Docs Viewer (docs.google.com/viewer) to display
 * PDFs — this is a third-party Google service that frequently fails to load
 * PDFs hosted on external hosts like Cloudinary, showing "No preview
 * available" / "لم تتوفر معاينة" instead of the file. It is unreliable and
 * outside our control. Now uses the app's own PDFViewer (pdf.js canvas
 * renderer, no external dependency, no download button) for PDFs — same
 * component already used across Online Videos and Notes.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import PDFViewer from '@/components/PDFViewer';

export default function FileViewerModal({ url, type, title = 'عرض الملف', onClose }) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header — same style as online page */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 shrink-0">
        <p className="text-white font-semibold text-sm truncate flex-1">{title}</p>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-white hover:bg-white/10 shrink-0"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white overflow-hidden">
        {type === 'pdf' ? (
          <PDFViewer url={url} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/20 p-4 overflow-auto">
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-full object-contain"
              onContextMenu={e => e.preventDefault()}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}