import React from 'react';

type InlineAlertProps = {
  className?: string;
  message: string;
};

/** 폼/페이지 상단 인라인 경고 — `signup-toast` 스타일과 호환 */
export function InlineAlert({ className = '', message }: InlineAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={`signup-toast ${className}`.trim()} role="alert">
      <span className="signup-toast__text">{message}</span>
    </div>
  );
}
