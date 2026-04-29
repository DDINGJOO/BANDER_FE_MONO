import React from 'react';
import { ReactComponent as SearchSvg } from '../../assets/icons/search.svg';
import { ReactComponent as WishlistSvg } from '../../assets/icons/wishlist.svg';
import { ReactComponent as ChatOffSvg } from '../../assets/icons/chat-off.svg';
import { ReactComponent as ChatOnSvg } from '../../assets/icons/chat-on.svg';
import { ReactComponent as AlarmSvg } from '../../assets/icons/alarm.svg';
import { ReactComponent as AlarmDotSvg } from '../../assets/icons/alarm-dot.svg';
import { ReactComponent as MetaHeartSvg } from '../../assets/icons/mobile/mobile-like-14x14.svg';
import { ReactComponent as MetaCommentSvg } from '../../assets/icons/mobile/mobile-comment-14x14.svg';
import { ReactComponent as StarFullSvg } from '../../assets/icons/star-full.svg';
import { ReactComponent as StarEmptySvg } from '../../assets/icons/star-none.svg';
import { ReactComponent as SnsKakaoSvg } from '../../assets/icons/mobile/mobile-sns-kakao.svg';
import { ReactComponent as SnsGoogleSvg } from '../../assets/icons/mobile/mobile-sns-google.svg';
import { ReactComponent as SnsAppleSvg } from '../../assets/icons/mobile/mobile-sns-apple.svg';

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
  return <SnsKakaoSvg aria-hidden="true" className="login-social__icon" />;
}

export function GoogleIcon() {
  return <SnsGoogleSvg aria-hidden="true" className="login-social__icon" />;
}

export function AppleIcon() {
  return <SnsAppleSvg aria-hidden="true" className="login-social__icon" />;
}

export function SearchIcon() {
  return <SearchSvg aria-hidden="true" className="home-search__icon" />;
}

export function HeaderWishlistIcon() {
  return <WishlistSvg aria-hidden="true" className="home-header__icon" />;
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

export function HeaderChatIcon({ active = false }: { active?: boolean }) {
  const Svg = active ? ChatOnSvg : ChatOffSvg;
  return <Svg aria-hidden="true" className="home-header__icon" />;
}

export function HeaderAlarmIcon({ hasUnread = false }: { hasUnread?: boolean }) {
  const Svg = hasUnread ? AlarmDotSvg : AlarmSvg;
  return <Svg aria-hidden="true" className="home-header__icon" />;
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
  return <MetaHeartSvg aria-hidden="true" className="home-meta__icon" />;
}

export function CommentIcon() {
  return <MetaCommentSvg aria-hidden="true" className="home-meta__icon" />;
}

export function StarIcon() {
  return <StarFullSvg aria-hidden="true" className="home-meta__icon home-meta__icon--star" />;
}

export function StarEmptyIcon() {
  return <StarEmptySvg aria-hidden="true" className="home-meta__icon home-meta__icon--star" />;
}
