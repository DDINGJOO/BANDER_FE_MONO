import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  NOTIFICATION_SETTINGS_DEFAULTS,
  type NotificationSettingsState,
} from '../data/notificationSettings';
import '../styles/notification-settings.css';

const ROWS: readonly {
  key: keyof NotificationSettingsState;
  title: string;
  description: string;
}[] = [
  {
    key: 'interestEnabled',
    title: '관심 알림',
    description: '스크랩 설정한 공간의 신규 알림',
  },
  {
    key: 'communityEnabled',
    title: '커뮤니티 알림',
    description: '작성한 글/댓글에 달린 댓글, 답글, 좋아요 알림',
  },
  {
    key: 'marketingEnabled',
    title: '마케팅 알림',
    description: '이벤트 및 혜택 관련 정보',
  },
];

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [settings, setSettings] = useState<NotificationSettingsState>(() => ({
    ...NOTIFICATION_SETTINGS_DEFAULTS,
  }));

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

  const toggle = (key: keyof NotificationSettingsState) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
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

          <div className="notification-settings__list" role="list">
            {ROWS.map((row) => (
              <div
                key={row.key}
                className="notification-settings__row"
                role="listitem"
              >
                <div className="notification-settings__text">
                  <p className="notification-settings__row-title">{row.title}</p>
                  <p className="notification-settings__row-desc">
                    {row.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings[row.key]}
                  aria-label={`${row.title} ${settings[row.key] ? '켜짐' : '꺼짐'}`}
                  className="notification-settings__switch"
                  onClick={() => toggle(row.key)}
                >
                  <span className="notification-settings__switch-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
