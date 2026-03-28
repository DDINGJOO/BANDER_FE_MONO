import React from 'react';
import { Link } from 'react-router-dom';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      aria-label="bander 메인으로 이동"
      className={`brand-mark brand-mark--link ${compact ? 'brand-mark--compact' : ''}`}
      to="/"
    >
      <span className="brand-mark__text">bander</span>
      <span aria-hidden="true" className="brand-mark__dot" />
    </Link>
  );
}
