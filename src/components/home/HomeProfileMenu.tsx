import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronIcon } from '../shared/Icons';
import type { HomeProfileMenuModel } from '../../types/homeProfileMenu';

export type HomeProfileMenuProps = {
  model: HomeProfileMenuModel;
  onLogoutClick: () => void;
  /** 프로필 수정 등 메뉴 내 이동 전 드롭다운 닫기 */
  onRequestClose?: () => void;
};

function ProfileMenuReservationIcon() {
  return (
    <svg aria-hidden="true" className="home-profile-menu__nav-icon" fill="none" viewBox="0 0 30 30">
      <rect height="18" rx="2" stroke="currentColor" strokeWidth="1.6" width="16" x="7" y="7" />
      <path d="M10 11h10M10 15h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ProfileMenuReviewIcon() {
  return (
    <svg aria-hidden="true" className="home-profile-menu__nav-icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M9 11h12v10H9V11z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M12 15l2 1.5 3-3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ProfileMenuPostIcon() {
  return (
    <svg aria-hidden="true" className="home-profile-menu__nav-icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M10 9h11l-2 4H10V9z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path d="M10 15h10M10 19h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ProfileMenuScrapIcon() {
  return (
    <svg aria-hidden="true" className="home-profile-menu__nav-icon" fill="none" viewBox="0 0 30 30">
      <path
        d="M11 8h8v14l-4-3-4 3V8z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ProfileMenuPointIcon() {
  return (
    <svg aria-hidden="true" className="home-profile-menu__reward-icon" fill="none" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6.5v3.2l2.2 1.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ProfileMenuCouponIcon() {
  return (
    <svg aria-hidden="true" className="home-profile-menu__reward-icon home-profile-menu__reward-icon--coupon" fill="none" viewBox="0 0 20 20">
      <path
        d="M4.5 6.5h11v7h-11v-7z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path d="M7.5 6.5v7" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1.2" />
    </svg>
  );
}

function ProfileMenuUserHeader({ model, onLogoutClick, onRequestClose }: HomeProfileMenuProps) {
  return (
    <div className="home-profile-menu__header">
      <div className="home-profile-menu__user">
        <div className="home-profile-menu__avatar-wrap">
          {model.profileImageUrl ? (
            <img alt="" className="home-profile-menu__avatar-img" height="60" src={model.profileImageUrl} width="60" />
          ) : (
            <span aria-hidden="true" className="home-profile-menu__avatar-ph" />
          )}
          <Link
            aria-label="프로필 수정"
            className="home-profile-menu__avatar-edit"
            to="/profile/edit"
            onClick={() => onRequestClose?.()}
          >
            <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12">
              <path
                d="M8.2 2.1l1.7 1.7-5 5H3.2V7.1l5-5z"
                stroke="#fff"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.2"
              />
            </svg>
          </Link>
        </div>
        <div className="home-profile-menu__user-text">
          <p className="home-profile-menu__display-name">{model.displayName}</p>
          <p className="home-profile-menu__email">{model.email}</p>
        </div>
      </div>
      <button className="home-profile-menu__logout-text" onClick={onLogoutClick} type="button">
        로그아웃
      </button>
    </div>
  );
}

function ProfileMenuMiniFeedCta() {
  return (
    <Link className="home-profile-menu__minifeed" to="/my-minifeed">
      <span className="home-profile-menu__minifeed-label">내 미니피드 보기</span>
      <span aria-hidden="true" className="home-profile-menu__minifeed-go">
        <ChevronIcon />
      </span>
    </Link>
  );
}

function ProfileMenuPointsCouponRow({ model }: Pick<HomeProfileMenuProps, 'model'>) {
  return (
    <div className="home-profile-menu__rewards">
      <Link className="home-profile-menu__reward home-profile-menu__reward--points" to="/">
        <ProfileMenuPointIcon />
        <span className="home-profile-menu__reward-value">
          {model.pointsLabel}
          <span aria-hidden="true" className="home-profile-menu__reward-chevron">
            <ChevronIcon />
          </span>
        </span>
      </Link>
      <Link className="home-profile-menu__reward home-profile-menu__reward--coupon" to="/">
        <ProfileMenuCouponIcon />
        <span className="home-profile-menu__reward-value home-profile-menu__reward-value--light">
          {model.couponCountLabel}
          <span aria-hidden="true" className="home-profile-menu__reward-chevron home-profile-menu__reward-chevron--light">
            <ChevronIcon />
          </span>
        </span>
      </Link>
    </div>
  );
}

type QuickItemProps = {
  badge?: number;
  href?: string;
  icon: React.ReactNode;
  label: string;
  onNavigate?: () => void;
};

function ProfileMenuQuickItem({ badge, href = '/', icon, label, onNavigate }: QuickItemProps) {
  return (
    <Link className="home-profile-menu__quick-item" to={href} onClick={() => onNavigate?.()}>
      {icon}
      <span className="home-profile-menu__quick-label">
        {label}
        {badge != null && badge > 0 ? (
          <span className="home-profile-menu__quick-badge">
            <span>{badge > 99 ? '99+' : badge}</span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function ProfileMenuQuickNav({ model, onRequestClose }: Pick<HomeProfileMenuProps, 'model' | 'onRequestClose'>) {
  return (
    <div className="home-profile-menu__quick-nav">
      <ProfileMenuQuickItem
        badge={model.reservationBadgeCount}
        href="/my-reservations"
        icon={<ProfileMenuReservationIcon />}
        label="내 예약"
        onNavigate={onRequestClose}
      />
      <ProfileMenuQuickItem
        href="/my-reviews"
        icon={<ProfileMenuReviewIcon />}
        label="내 리뷰"
        onNavigate={onRequestClose}
      />
      <ProfileMenuQuickItem icon={<ProfileMenuPostIcon />} label="내 게시글" onNavigate={onRequestClose} />
      <ProfileMenuQuickItem icon={<ProfileMenuScrapIcon />} label="스크랩" onNavigate={onRequestClose} />
    </div>
  );
}

const SETTINGS_ITEMS: readonly { label: string; to?: string }[] = [
  { label: '계정 설정', to: '/account/settings' },
  { label: '알림 설정', to: '/notification-settings' },
  { label: '결제 정보', to: '/payment-info' },
  { label: '고객센터' },
  { label: '약관정보' },
];

function ProfileMenuSettingsList({
  onRequestClose,
}: {
  onRequestClose?: () => void;
}) {
  return (
    <div className="home-profile-menu__settings">
      {SETTINGS_ITEMS.map((item) =>
        item.to ? (
          <Link
            className="home-profile-menu__settings-row home-profile-menu__settings-row--link"
            key={item.label}
            to={item.to}
            onClick={() => onRequestClose?.()}
          >
            {item.label}
          </Link>
        ) : (
          <button className="home-profile-menu__settings-row" key={item.label} type="button">
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

function ProfileMenuBusinessBanner() {
  return (
    <Link className="home-profile-menu__business" to="/">
      <div className="home-profile-menu__business-inner">
        <div className="home-profile-menu__business-copy">
          <p className="home-profile-menu__business-kicker">밴더 비즈니스</p>
          <p className="home-profile-menu__business-title">당신의 공간, 밴더와 함께하고</p>
          <p className="home-profile-menu__business-title">수익 창출을 누려보세요.</p>
        </div>
        <span className="home-profile-menu__business-cta">
          <span className="home-profile-menu__business-cta-text">신청하기</span>
          <span aria-hidden="true" className="home-profile-menu__business-cta-icon">
            <ChevronIcon />
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Figma 6052:30970 — 헤더 프로필 드롭다운 (섹션별 서브컴포넌트 조합) */
export function HomeProfileMenu(props: HomeProfileMenuProps) {
  const { model, onLogoutClick, onRequestClose } = props;

  return (
    <div className="home-profile-menu" role="menu">
      <div className="home-profile-menu__top">
        <ProfileMenuUserHeader model={model} onLogoutClick={onLogoutClick} onRequestClose={onRequestClose} />
        <ProfileMenuMiniFeedCta />
        <ProfileMenuPointsCouponRow model={model} />
        <ProfileMenuQuickNav model={model} onRequestClose={onRequestClose} />
      </div>
      <div className="home-profile-menu__bottom">
        <ProfileMenuSettingsList onRequestClose={onRequestClose} />
        <ProfileMenuBusinessBanner />
      </div>
    </div>
  );
}
