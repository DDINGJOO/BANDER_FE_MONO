import React, { forwardRef } from 'react';

export type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** 래퍼에 추가 (예: `login-input`) */
  wrapClassName?: string;
};

/**
 * 기본 텍스트 입력. 전역 폼 스타일(`login-input__control` 등)과 조합해 사용합니다.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { className = '', wrapClassName, ...rest },
  ref
) {
  const control = (
    <input ref={ref} className={className.trim() || undefined} {...rest} />
  );

  if (wrapClassName) {
    return <div className={wrapClassName}>{control}</div>;
  }

  return control;
});
