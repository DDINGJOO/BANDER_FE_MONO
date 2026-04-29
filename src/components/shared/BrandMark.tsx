import React from 'react';
import { Link } from 'react-router-dom';

const LOGO_SRC = `${process.env.PUBLIC_URL ?? ''}/logo.svg`;

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      aria-label="bander 메인으로 이동"
      className={`brand-mark brand-mark--link ${compact ? 'brand-mark--compact' : ''}`}
      to="/"
    >
      <img alt="bander" className="brand-mark__image" src={LOGO_SRC} />
    </Link>
  );
}
