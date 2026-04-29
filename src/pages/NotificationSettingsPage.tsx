import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferencesChange,
} from '../api/notification-preferences';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import '../styles/notification-settings.css';

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  // 관심 / 커뮤니티 — 실 API 연동
  const [interestAppPush, setInterestAppPush] = useState<boolean | null>(null);
  const [communityAppPush, setCommunityAppPush] = useState<boolean | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefPending, setPrefPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 마케팅 — Phase 4 에서 AccountSettingsPage 에 처리됨, 본 페이지는 local 상태 유지
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerSearchRef.current?.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // mount 시 GET → 관심/커뮤니티 초기값 설정
  useEffect(() => {
    let cancelled = false;
    getNotificationPreferences()
      .then((view) => {
        if (cancelled) return;
        setInterestAppPush(view.interestAppPush);
        setCommunityAppPush(view.communityAppPush);
      })
      .catch(() => {
        if (cancelled) return;
        setPrefError('알림 설정을 불러오지 못했습니다.');
        setInterestAppPush(true); // fallback default
        setCommunityAppPush(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patchDebounced = (
    change: NotificationPreferencesChange,
    prevSnapshot: { interest: boolean; community: boolean },
  ) => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPrefPending(true);
      try {
        const view = await updateNotificationPreferences(change);
        setInterestAppPush(view.interestAppPush);
        setCommunityAppPush(view.communityAppPush);
        setPrefError(null);
      } catch {
        // 낙관적 업데이트 롤백
        setInterestAppPush(prevSnapshot.interest);
        setCommunityAppPush(prevSnapshot.community);
        setPrefError('변경 실패. 잠시 후 다시 시도해주세요.');
      } finally {
        setPrefPending(false);
      }
    }, 300);
  };

  const handleInterestToggle = () => {
    if (interestAppPush === null || communityAppPush === null || prefPending) return;
    const prev = { interest: interestAppPush, community: communityAppPush };
    const next = !interestAppPush;
    setInterestAppPush(next); // optimistic
    patchDebounced({ interestAppPush: next }, prev);
  };

  const handleCommunityToggle = () => {
    if (interestAppPush === null || communityAppPush === null || prefPending) return;
    const prev = { interest: interestAppPush, community: communityAppPush };
    const next = !communityAppPush;
    setCommunityAppPush(next); // optimistic
    patchDebounced({ communityAppPush: next }, prev);
  };

  return (
    <main className="notification-settings-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate('/login')}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() =>
          setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))
        }
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="notification-settings-page__main">
        <div className="notification-settings">
          <header className="notification-settings__header">
            <button
              type="button"
              className="notification-settings__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="notification-settings__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="notification-settings__title">알림 설정</h1>
          </header>

          {prefError !== null && (
            <p style={{ color: '#e74c3c', fontSize: '13px', margin: '0 0 8px 0', padding: '0 16px' }}>
              {prefError}
            </p>
          )}

          <div className="notification-settings__list" role="list">
            {/* 관심 알림 — 실 API */}
            <div className="notification-settings__row" role="listitem">
              <div className="notification-settings__text">
                <p className="notification-settings__row-title">관심 알림</p>
                <p className="notification-settings__row-desc">
                  스크랩 설정한 공간의 신규 알림
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={interestAppPush ?? false}
                aria-label={`관심 알림 ${interestAppPush ? '켜짐' : '꺼짐'}`}
                className="notification-settings__switch"
                disabled={interestAppPush === null || prefPending}
                onClick={handleInterestToggle}
              >
                <span className="notification-settings__switch-knob" />
              </button>
            </div>

            {/* 커뮤니티 알림 — 실 API */}
            <div className="notification-settings__row" role="listitem">
              <div className="notification-settings__text">
                <p className="notification-settings__row-title">커뮤니티 알림</p>
                <p className="notification-settings__row-desc">
                  작성한 글/댓글에 달린 댓글, 답글, 좋아요 알림
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={communityAppPush ?? false}
                aria-label={`커뮤니티 알림 ${communityAppPush ? '켜짐' : '꺼짐'}`}
                className="notification-settings__switch"
                disabled={communityAppPush === null || prefPending}
                onClick={handleCommunityToggle}
              >
                <span className="notification-settings__switch-knob" />
              </button>
            </div>

            {/* 마케팅 알림 — Phase 4 에서 AccountSettingsPage 처리됨, 여기서는 local 상태 */}
            <div className="notification-settings__row" role="listitem">
              <div className="notification-settings__text">
                <p className="notification-settings__row-title">마케팅 알림</p>
                <p className="notification-settings__row-desc">
                  이벤트 및 혜택 관련 정보
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={marketingEnabled}
                aria-label={`마케팅 알림 ${marketingEnabled ? '켜짐' : '꺼짐'}`}
                className="notification-settings__switch"
                onClick={() => setMarketingEnabled((prev) => !prev)}
              >
                <span className="notification-settings__switch-knob" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
