import React from 'react';

export function CheckIcon() {
  return (
    <svg aria-hidden="true" className="login-keep__icon" fill="none" viewBox="0 0 14 14">
      <path
        d="M3 7.15L5.65 9.8L11 4.45"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function ErrorIcon() {
  return (
    <svg aria-hidden="true" className="signup-error-icon" fill="none" viewBox="0 0 14 14">
      <circle cx="7" cy="7" fill="#FF3A3D" r="6.5" />
      <path d="M7 3.6V7.4" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.2" />
      <circle cx="7" cy="10.1" fill="#FFFFFF" r="0.85" />
    </svg>
  );
}

export function AvailabilityIcon() {
  return (
    <svg aria-hidden="true" className="signup-status__icon" fill="none" viewBox="0 0 14 14">
      <path
        d="M3 7.2L5.55 9.75L11 4.3"
        stroke="#2C80FF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function SuccessIcon() {
  return (
    <svg aria-hidden="true" className="signup-status__icon" fill="none" viewBox="0 0 14 14">
      <circle cx="7" cy="7" fill="#16A34A" r="7" />
      <path
        d="M3.7 7.05L5.85 9.2L10.2 4.85"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function SelectedCheckIcon() {
  return (
    <svg aria-hidden="true" className="signup-region-menu__check" fill="none" viewBox="0 0 14 14">
      <path
        d="M3.2 7.15L5.75 9.7L10.8 4.65"
        stroke="#FFA20C"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function UnavailableIcon() {
  return (
    <svg aria-hidden="true" className="signup-status__icon" fill="none" viewBox="0 0 14 14">
      <circle cx="7" cy="7" fill="#FF3A3D" r="7" />
      <path d="M4.5 4.5L9.5 9.5" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M9.5 4.5L4.5 9.5" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg aria-hidden="true" className="signup-profile__camera-icon" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.48 4.17L6.39 3H9.62L10.53 4.17H12C12.74 4.17 13.33 4.76 13.33 5.5V11.17C13.33 11.9 12.74 12.5 12 12.5H4C3.26 12.5 2.67 11.9 2.67 11.17V5.5C2.67 4.76 3.26 4.17 4 4.17H5.48Z"
        fill="#FFFFFF"
      />
      <circle cx="8" cy="8.33" fill="#161A24" r="2.33" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="signup-profile__chevron" fill="none" viewBox="0 0 14 14">
      <path
        d="M4 5.5L7 8.5L10 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function KakaoIcon() {
  return (
    <svg aria-hidden="true" className="login-social__icon" fill="none" viewBox="0 0 50 50">
      <circle cx="25" cy="25" fill="#F6D155" r="25" />
      <path
        d="M25 14.5C18.82 14.5 13.82 18.44 13.82 23.31C13.82 26.54 16.03 29.37 19.31 30.92L18.2 35.43C18.11 35.8 18.53 36.09 18.86 35.87L24.06 32.37C24.37 32.4 24.68 32.42 25 32.42C31.17 32.42 36.18 28.47 36.18 23.61C36.18 18.74 31.17 14.5 25 14.5Z"
        fill="#000000"
      />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="login-social__icon" fill="none" viewBox="0 0 50 50">
      <circle cx="25" cy="25" fill="#FFFFFF" r="24.5" stroke="#F0F2F5" />
      <path
        d="M35.04 25.2C35.04 24.35 34.97 23.72 34.82 23.06H25.32V26.82H30.9C30.78 27.75 30.12 29.15 28.66 30.09L28.64 30.22L31.66 32.52L31.87 32.54C33.83 30.77 35.04 28.17 35.04 25.2Z"
        fill="#4285F4"
      />
      <path
        d="M25.32 35C28.05 35 30.34 34.11 31.87 32.54L28.66 30.09C27.8 30.68 26.66 31.09 25.32 31.09C22.64 31.09 20.37 29.32 19.56 26.88L19.43 26.89L16.29 29.28L16.24 29.4C17.76 32.36 21.26 35 25.32 35Z"
        fill="#34A853"
      />
      <path
        d="M19.56 26.88C19.34 26.22 19.21 25.51 19.21 24.77C19.21 24.03 19.34 23.32 19.55 22.66L19.55 22.52L16.36 20.1L16.24 20.15C15.61 21.41 15.25 22.82 15.25 24.77C15.25 26.72 15.61 28.13 16.24 29.39L19.56 26.88Z"
        fill="#FBBC05"
      />
      <path
        d="M25.32 18.45C27.01 18.45 28.15 19.18 28.8 19.78L31.94 16.76C30.33 15.29 28.05 14.4 25.32 14.4C21.26 14.4 17.76 17.04 16.24 20.15L19.55 22.66C20.37 20.21 22.64 18.45 25.32 18.45Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg aria-hidden="true" className="login-social__icon" fill="none" viewBox="0 0 50 50">
      <circle cx="25" cy="25" fill="#000000" r="25" />
      <path
        d="M30.2 17.38C29.1 18.66 27.3 19.64 25.62 19.49C25.41 17.92 26.09 16.28 27.12 15.1C28.23 13.84 30.08 12.92 31.56 13C31.71 14.61 31.09 16.15 30.2 17.38ZM31.53 20.12C29.84 20.03 28.4 21.11 27.59 21.11C26.72 21.11 25.42 20.18 24.01 20.21C22.15 20.24 20.42 21.3 19.47 22.96C17.52 26.29 18.95 31.15 20.84 33.85C21.79 35.18 22.89 36.66 24.34 36.61C25.74 36.56 26.27 35.74 27.97 35.74C29.64 35.74 30.14 36.61 31.62 36.58C33.15 36.56 34.1 35.23 35.01 33.88C36.11 32.36 36.55 30.87 36.57 30.79C36.54 30.78 33.62 29.67 33.59 26.4C33.56 23.64 35.88 22.35 35.99 22.28C34.67 20.38 32.63 20.16 31.53 20.12Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg aria-hidden="true" className="home-search__icon" fill="none" viewBox="0 0 18 18">
      <circle cx="7.75" cy="7.75" r="4.75" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11.4 11.4L15 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export function HeaderCartIcon() {
  return (
    <svg aria-hidden="true" className="home-header__icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M9.5 9.5H23L21.2 18.1H11.4L9.5 9.5ZM9.5 9.5L8.8 7.2C8.65 6.75 8.25 6.45 7.8 6.45H6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
      <circle cx="12.5" cy="22.5" fill="currentColor" opacity="0.15" r="1.6" />
      <circle cx="19.5" cy="22.5" fill="currentColor" opacity="0.15" r="1.6" />
    </svg>
  );
}

export function HeaderWishlistIcon() {
  return (
    <svg aria-hidden="true" className="home-header__icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M15 22.5L8.2 16.35C7.15 15.4 6.95 13.85 7.75 12.65C8.5 11.5 10.1 11.15 11.35 11.95L15 14.45L18.65 11.95C19.9 11.15 21.5 11.5 22.25 12.65C23.05 13.85 22.85 15.4 21.8 16.35L15 22.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

export function HeaderBookmarkIcon() {
  return (
    <svg aria-hidden="true" className="home-header__icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M10.85 7.3C10.85 6.61 11.41 6.05 12.1 6.05H17.9C18.59 6.05 19.15 6.61 19.15 7.3V22.25L15 19.16L10.85 22.25V7.3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M13.1 10.15H16.9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

export function HeaderChatIcon() {
  return (
    <svg aria-hidden="true" className="home-header__icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M8.15 9.4C8.15 8.52 8.87 7.8 9.75 7.8H20.25C21.13 7.8 21.85 8.52 21.85 9.4V16.75C21.85 17.63 21.13 18.35 20.25 18.35H14.3L10.5 21.1V18.35H9.75C8.87 18.35 8.15 17.63 8.15 16.75V9.4Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M11.45 12.9H18.55"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

export function HeaderAlarmIcon() {
  return (
    <svg aria-hidden="true" className="home-header__icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M15 23.05C16.13 23.05 17.05 22.13 17.05 21H12.95C12.95 22.13 13.87 23.05 15 23.05Z"
        fill="currentColor"
      />
      <path
        d="M10.35 18.35H19.65C18.95 17.45 18.55 16.33 18.55 15.15V13.15C18.55 10.89 16.93 9.03 14.8 8.66V8.2C14.8 7.76 15.16 7.4 15.6 7.4H14.4C14.84 7.4 15.2 7.76 15.2 8.2V8.66C13.07 9.03 11.45 10.89 11.45 13.15V15.15C11.45 16.33 11.05 17.45 10.35 18.35Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function BookmarkIcon() {
  return (
    <svg aria-hidden="true" className="home-card__bookmark" fill="none" viewBox="0 0 28 28">
      <path
        d="M9 6.5C9 5.67 9.67 5 10.5 5H17.5C18.33 5 19 5.67 19 6.5V22L14 18.3L9 22V6.5Z"
        fill="rgba(0,0,0,0.36)"
      />
      <path
        d="M9 6.5C9 5.67 9.67 5 10.5 5H17.5C18.33 5 19 5.67 19 6.5V22L14 18.3L9 22V6.5Z"
        stroke="rgba(255,255,255,0.75)"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg aria-hidden="true" className="home-meta__icon" fill="none" viewBox="0 0 14 14">
      <path
        d="M7 11.65L2.8 8.02C1.8 7.15 1.6 5.68 2.34 4.54C3.05 3.45 4.51 3.14 5.61 3.83L7 4.7L8.39 3.83C9.49 3.14 10.95 3.45 11.66 4.54C12.4 5.68 12.2 7.15 11.2 8.02L7 11.65Z"
        fill="#CDD3E0"
      />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg aria-hidden="true" className="home-meta__icon" fill="none" viewBox="0 0 14 14">
      <path
        d="M2.2 3.1H11.8V9.2H6.65L4.1 11V9.2H2.2V3.1Z"
        fill="#CDD3E0"
        stroke="#CDD3E0"
        strokeLinejoin="round"
        strokeWidth="0.6"
      />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg aria-hidden="true" className="home-meta__icon home-meta__icon--star" fill="none" viewBox="0 0 14 14">
      <path
        d="M7 1.65L8.64 4.98L12.32 5.52L9.66 8.1L10.28 11.75L7 10.03L3.72 11.75L4.34 8.1L1.68 5.52L5.36 4.98L7 1.65Z"
        fill="#F6D155"
      />
    </svg>
  );
}
