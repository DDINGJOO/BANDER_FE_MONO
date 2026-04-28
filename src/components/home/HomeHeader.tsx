import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../../data/authSession';
import { fetchUnreadNotificationCount } from '../../api/notifications';
import { getMySummary, logout as apiLogout, type UserMeSummary } from '../../api/users';
import { isMockMode } from '../../config/publicEnv';
import { resolveProfileImageUrl } from '../../config/media';
import { resolveHomeProfileMenuModel, type HomeProfileMenuModel } from '../../types/homeProfileMenu';
import { BrandMark } from '../shared/BrandMark';
import {
  ChevronIcon,
  HeaderAlarmIcon,
  HeaderCartIcon,
  HeaderChatIcon,
  HeaderWishlistIcon,
  SearchIcon,
} from '../shared/Icons';
import { HomeProfileMenu } from './HomeProfileMenu';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { useGuestGate } from './GuestGateProvider';

type HomeHeaderSharedProps = {
  authenticated: boolean;
  onGuestCta?: () => void;
  /** Figma 프로필 드롭다운 — API 필드 매핑용 */
  profileMenu?: Partial<HomeProfileMenuModel>;
};

export type HomeHeaderSearchBarProps = HomeHeaderSharedProps & {
  variant?: 'bar';
  filteredSuggestions: string[];
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchFocus: () => void;
  onSearchSubmit: (value: string) => void;
  onSuggestionSelect: (value: string) => void;
  searchOpen: boolean;
  searchQuery: string;
  searchRef: React.RefObject<HTMLDivElement | null>;
};

export type HomeHeaderSearchIconProps = HomeHeaderSharedProps & {
  variant: 'icon';
};

export type HomeHeaderProps = HomeHeaderSearchBarProps | HomeHeaderSearchIconProps;

function isSearchBar(props: HomeHeaderProps): props is HomeHeaderSearchBarProps {
  return props.variant !== 'icon';
}

function formatBadgeCount(count: number) {
  return count > 99 ? '99+' : String(count);
}

// Module-level cache so cross-page navigation does not refetch or flicker.
let cachedUserSummary: UserMeSummary | null = null;
const summarySubscribers = new Set<(s: UserMeSummary | null) => void>();
let summaryFetchInFlight: Promise<UserMeSummary | null> | null = null;

// 종 아이콘 미읽음 배지: 30초 폴링 (user-gateway → feed-service).
// Backend 쪽 UnreadCountCache (Redis) 가 상수 시간 응답하므로 polling 비용은 낮다.
// 화면에 100+ 정도까지 표시하고, 그 이상은 "99+" 로 압축한다.
const UNREAD_POLL_INTERVAL_MS = 30_000;

function formatUnreadBadge(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

function fetchUserSummaryOnce(): Promise<UserMeSummary | null> {
  if (cachedUserSummary) return Promise.resolve(cachedUserSummary);
  if (summaryFetchInFlight) return summaryFetchInFlight;
  summaryFetchInFlight = getMySummary()
    .then((s) => {
      cachedUserSummary = s;
      summarySubscribers.forEach((cb) => cb(s));
      return s;
    })
    .catch(() => null)
    .finally(() => {
      summaryFetchInFlight = null;
    });
  return summaryFetchInFlight;
}

export function invalidateUserSummaryCache() {
  cachedUserSummary = null;
  summarySubscribers.forEach((cb) => cb(null));
}

export function HomeHeader(props: HomeHeaderProps) {
  const { authenticated, profileMenu: profileMenuPartial } = props;
  const bar = isSearchBar(props);
  const navigate = useNavigate();
  const location = useLocation();
  const { openGuestGate } = useGuestGate();
  const chatPageActive = location.pathname.startsWith('/chat');
  const communityPageActive = location.pathname.startsWith('/community');
  const profileRootRef = useRef<HTMLDivElement | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-fetch user summary once per session and reuse across pages.
  const [summary, setSummary] = useState<UserMeSummary | null>(cachedUserSummary);
  useEffect(() => {
    if (!authenticated) return;
    const notify = (s: UserMeSummary | null) => setSummary(s);
    summarySubscribers.add(notify);
    fetchUserSummaryOnce().then((s) => {
      if (s) setSummary(s);
    });
    return () => {
      summarySubscribers.delete(notify);
    };
  }, [authenticated]);

  // 미읽음 알림 배지 — 로그인 상태일 때만 주기적으로 폴링. mock mode 는 skip.
  const [unreadCount, setUnreadCount] = useState<number>(0);
  useEffect(() => {
    if (!authenticated || isMockMode()) {
      setUnreadCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchUnreadNotificationCount();
        if (!cancelled) setUnreadCount(res?.count ?? 0);
      } catch {
        // 네트워크 실패 시 조용히 skip — 다음 tick 에 재시도. 세션 만료(401) 는
        // 상위 라우터에서 로그인 화면으로 유도되므로 여기서 별도 처리하지 않는다.
      }
    };
    load();
    const timer = window.setInterval(load, UNREAD_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [authenticated]);

  // Prefer explicit props override, otherwise derive from cached summary.
  const derivedFromSummary: Partial<HomeProfileMenuModel> | undefined = summary
    ? {
        displayName: summary.displayName,
        email: summary.email,
        profileImageUrl: resolveProfileImageUrl(summary.profileImageRef, summary.profileImageUrl),
        pointsLabel: summary.pointsLabel,
        couponCountLabel: summary.couponCountLabel,
        reservationBadgeCount: summary.reservationBadgeCount,
      }
    : undefined;
  const profileModel = resolveHomeProfileMenuModel(profileMenuPartial ?? derivedFromSummary);
  const reservationBadgeCount = Math.max(0, profileModel.reservationBadgeCount);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }
    const onDocMouseDown = (event: MouseEvent) => {
      const node = profileRootRef.current;
      if (node && !node.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [profileOpen]);

  const handleGuestCta = () => {
    openGuestGate(`${location.pathname}${location.search}${location.hash}`);
  };

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [profileOpen]);

  return (
    <header className={`home-header ${authenticated ? 'home-header--authenticated' : ''}`}>
      <div className={`home-header__inner ${authenticated ? 'home-header__inner--authenticated' : ''}`}>
        <div className={`home-header__main ${authenticated ? 'home-header__main--authenticated' : ''}`}>
          <BrandMark compact />

          {bar ? (
            <div className="home-header__search" ref={props.searchRef}>
              <div
                className={
                  authenticated
                    ? 'home-header__search-field home-header__search-field--authenticated'
                    : 'home-header__search-field'
                }
              >
                {authenticated ? null : <SearchIcon />}
                <input
                  className="home-header__search-input"
                  onChange={(event) => {
                    props.onSearchChange(event.target.value);
                  }}
                  onFocus={props.onSearchFocus}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      props.onSearchSubmit(props.searchQuery);
                    }
                  }}
                  placeholder="공간, 업체, 커뮤니티 검색"
                  value={props.searchQuery}
                />
                <div className="home-header__search-actions">
                  {props.searchQuery ? (
                    <button
                      aria-label="검색어 지우기"
                      className="home-header__search-clear"
                      onClick={props.onSearchClear}
                      type="button"
                    >
                      ×
                    </button>
                  ) : null}
                  <button
                    aria-label="헤더 검색 실행"
                    className="home-header__search-submit"
                    onClick={() => props.onSearchSubmit(props.searchQuery)}
                    type="button"
                  >
                    <SearchIcon />
                  </button>
                </div>
              </div>

              {props.searchOpen && props.searchQuery ? (
                <div className="home-header__search-menu">
                  {props.filteredSuggestions.map((item) => {
                    const [prefix, suffix] = item.split(props.searchQuery);

                    return (
                      <button
                        className="home-header__search-option"
                        key={item}
                        onClick={() => props.onSuggestionSelect(item)}
                        type="button"
                      >
                        <span>{prefix ?? ''}</span>
                        <span className="home-header__search-highlight">{props.searchQuery}</span>
                        <span>{suffix ?? ''}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="home-header__search home-header__search--icon">
              <Link aria-label="공간 검색" className="home-header__search-icon-link" to="/search">
                <SearchIcon />
              </Link>
            </div>
          )}

          <nav className={`home-header__nav ${authenticated ? 'home-header__nav--authenticated' : ''}`}>
            {authenticated ? (
              <>
                <Link
                  aria-current={communityPageActive ? 'page' : undefined}
                  className={communityPageActive ? 'home-header__nav-link--active' : undefined}
                  to="/community"
                >
                  커뮤니티
                </Link>
                <Link to="/search/map">탐색</Link>
                <Link className="home-header__reservation-link" to="/my-reservations">
                  <span>예약</span>
                  {reservationBadgeCount > 0 ? (
                    <span className="home-header__reservation-badge">{formatBadgeCount(reservationBadgeCount)}</span>
                  ) : null}
                </Link>
              </>
            ) : (
              <>
                <Link
                  aria-current={communityPageActive ? 'page' : undefined}
                  className={communityPageActive ? 'home-header__nav-link--active' : undefined}
                  to="/community"
                >
                  커뮤니티
                </Link>
                <Link to={{ hash: 'spaces', pathname: '/' }}>탐색</Link>
                <Link to={{ hash: 'reviews', pathname: '/' }}>후기</Link>
              </>
            )}
          </nav>

          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            className={`home-header__mobile-toggle${mobileMenuOpen ? ' home-header__mobile-toggle--open' : ''}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {authenticated ? (
          <div className="home-header__auth-actions">
            <button aria-label="장바구니" className="home-header__icon-button home-header__icon-button--cart" type="button">
              <HeaderCartIcon />
            </button>
            <button aria-label="찜 목록" className="home-header__icon-button" type="button">
              <HeaderWishlistIcon />
            </button>
            <Link
              aria-current={chatPageActive ? 'page' : undefined}
              aria-label="채팅"
              className={`home-header__icon-button${chatPageActive ? ' home-header__icon-button--chat-on' : ''}`}
              to="/chat"
            >
              <HeaderChatIcon />
            </Link>
            <Link
              aria-label={
                unreadCount > 0 ? `알림 ${formatUnreadBadge(unreadCount)}개 있음` : '알림'
              }
              className="home-header__icon-button home-header__icon-button--alert"
              to="/notifications"
            >
              <HeaderAlarmIcon />
              {unreadCount > 0 ? (
                <span aria-hidden="true" className="home-header__icon-badge">
                  {formatUnreadBadge(unreadCount)}
                </span>
              ) : null}
            </Link>
            <div className="home-header__profile-wrap" ref={profileRootRef}>
              <button
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="프로필 메뉴"
                className="home-header__profile"
                onClick={() => setProfileOpen((open) => !open)}
                type="button"
              >
                {profileModel.profileImageUrl ? (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="home-header__avatar"
                    src={profileModel.profileImageUrl}
                  />
                ) : (
                  <span aria-hidden="true" className="home-header__avatar" />
                )}
                <span aria-hidden="true" className="home-header__profile-arrow">
                  <ChevronIcon />
                </span>
              </button>
              {profileOpen ? (
                <div className="home-header__profile-dropdown">
                  <HomeProfileMenu
                    model={profileModel}
                    onRequestClose={() => setProfileOpen(false)}
                    onLogoutClick={() => {
                      setProfileOpen(false);
                      setLogoutOpen(true);
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="home-header__actions">
            <button className="home-header__button" onClick={handleGuestCta} type="button">
              로그인/회원가입
            </button>
          </div>
        )}

      </div>

      {mobileMenuOpen ? (
        <div className="home-header__mobile-layer">
          <button
            aria-label="모바일 메뉴 닫기"
            className="home-header__mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          />
          <aside aria-label="모바일 메뉴" className="home-header__mobile-drawer">
            <div className="home-header__mobile-head">
              <BrandMark compact />
              <button
                aria-label="메뉴 닫기"
                className="home-header__mobile-close"
                onClick={() => setMobileMenuOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <nav className="home-header__mobile-nav">
              <Link
                aria-current={communityPageActive ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
                to="/community"
              >
                커뮤니티
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} to={authenticated ? '/search/map' : { hash: 'spaces', pathname: '/' }}>
                탐색
              </Link>
              {authenticated ? (
                <Link className="home-header__mobile-reservation" onClick={() => setMobileMenuOpen(false)} to="/my-reservations">
                  <span>예약</span>
                  {reservationBadgeCount > 0 ? (
                    <span className="home-header__reservation-badge">{formatBadgeCount(reservationBadgeCount)}</span>
                  ) : null}
                </Link>
              ) : (
                <Link onClick={() => setMobileMenuOpen(false)} to={{ hash: 'reviews', pathname: '/' }}>
                  후기
                </Link>
              )}
            </nav>

            {authenticated ? (
              <div className="home-header__mobile-actions">
                <Link onClick={() => setMobileMenuOpen(false)} to="/chat">
                  채팅
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} to="/notifications">
                  <span>알림</span>
                  {unreadCount > 0 ? (
                    <span className="home-header__mobile-badge">{formatUnreadBadge(unreadCount)}</span>
                  ) : null}
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} to="/profile/edit">
                  프로필 수정
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} to="/account/settings">
                  계정 설정
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} to="/payment-info">
                  결제 정보
                </Link>
                <Link onClick={() => setMobileMenuOpen(false)} to="/points">
                  포인트
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLogoutOpen(true);
                  }}
                  type="button"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                className="home-header__mobile-login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleGuestCta();
                }}
                type="button"
              >
                로그인/회원가입
              </button>
            )}
          </aside>
        </div>
      ) : null}

      <LogoutConfirmModal
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          try {
            await apiLogout();
          } catch {
            // logout may fail if session already expired, proceed anyway
          }
          clearAuthSession();
          invalidateUserSummaryCache();
          setLogoutOpen(false);
          navigate(0);
        }}
        open={logoutOpen}
      />
    </header>
  );
}
