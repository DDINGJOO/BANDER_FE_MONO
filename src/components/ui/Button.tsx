import React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  ghost: '',
  primary: 'login-button',
};

/**
 * 로그인/가입 계열과 동일한 시각 언어의 버튼. `className`으로 페이지별 변형을 덧씌웁니다.
 */
export function Button({ className = '', variant = 'primary', type = 'button', ...rest }: ButtonProps) {
  const base = variantClass[variant];
  return <button className={`${base} ${className}`.trim()} type={type} {...rest} />;
}
