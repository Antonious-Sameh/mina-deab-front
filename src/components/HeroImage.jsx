import React from 'react';

// يعرض الصورة كاملة بنسبتها الأصلية (بدون قص) داخل إطار ثابت،
// والمساحة الفاضية حوالين الصورة بتتملي بنفس الصورة مغبّشة فالشكل يفضل متناسق.
export default function HeroImage({ src, alt = '', className = '', imgClassName = '' }) {
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60 pointer-events-none select-none"
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`relative z-10 w-full h-full object-contain ${imgClassName}`}
      />
    </div>
  );
}
