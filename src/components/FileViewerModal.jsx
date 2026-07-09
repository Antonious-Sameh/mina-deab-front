/**
 * FileViewerModal.jsx
 * Shared modal — same approach as StudentOnlinePage's PdfViewer (Google Docs Viewer).
 * Works cross-origin, no download button, no PDF.js complexity.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function FileViewerModal({ url, type, title = 'عرض الملف', onClose }) {
  if (!url) return null;

  // Same as StudentOnlinePage — Google Docs Viewer handles PDF display inline
  const viewerUrl = type === 'pdf'
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    : url;

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
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
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