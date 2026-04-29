import React from 'react';
import { resolveKeywordIcon } from '../../data/keywordIcons';

export type KeywordChipProps = {
  label: string;
  className?: string;
};

export function KeywordChip({ label, className }: KeywordChipProps) {
  const icon = resolveKeywordIcon(label);
  return (
    <span className={className}>
      {icon ? (
        <img alt="" aria-hidden="true" className="keyword-chip__icon keyword-chip__icon--svg" src={icon.src} />
      ) : null}
      <span className="keyword-chip__label">{label}</span>
    </span>
  );
}
