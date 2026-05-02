import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { isMockMode } from '../config/publicEnv';
import { loadAuthSession } from '../data/authSession';
import {
  APP_NOTIFICATIONS,
  filterNotifications,
  type AppNotification,
  type NotificationIconKind,
  type NotificationTabFilter,
} from '../data/notifications';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import { notificationsFromApiPage } from '../data/adapters/notificationsFromApi';
import { emitNotificationUnreadCountChange } from '../lib/notificationUnreadEvents';
import '../styles/notifications.css';

/** Figma 6465:30579 — 헤더 알림과 동일 실루엣, 66px · Gray 4 톤 */
function NotificationsEmptyBell() {
  return (
    <svg
      aria-hidden
      className="notifications__empty-bell"
      fill="none"
      height="66"
      viewBox="0 0 30 30"
      width="66"
    >
      <path
        d="M15 23.05C16.13 23.05 17.05 22.13 17.05 21H12.95C12.95 22.13 13.87 23.05 15 23.05Z"
        fill="currentColor"
      />
      <path
        d="M10.35 18.35H19.65C18.95 17.45 18.55 16.33 18.55 15.15V13.15C18.55 10.89 16.93 9.03 14.8 8.66V8.2C14.8 7.76 15.16 7.4 15.6 7.4H14.4C14.84 7.4 15.2 7.76 15.2 8.2V8.66C13.07 9.03 11.45 10.89 11.45 13.15V15.15C11.45 16.33 11.05 17.45 10.35 18.35Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const TABS: readonly { id: NotificationTabFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'activity', label: '활동' },
  { id: 'news', label: '소식/이벤트' },
];

function NotificationGlyph({ kind }: { kind: NotificationIconKind }) {
  switch (kind) {
    case 'like':
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M9 15.5L8.1 14.7C4.5 11.5 2 9.2 2 6.3 2 4.1 3.7 2.5 5.8 2.5c1.2 0 2.3.55 3 1.4.7-.85 1.8-1.4 3-1.4 2.1 0 3.8 1.6 3.8 3.8 0 2.9-2.5 5.2-6.1 8.4L9 15.5z"
            fill="currentColor"
          />
        </svg>
      );
    case 'bell':
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M9 2.25a4.5 4.5 0 014.5 4.5v2.55c0 .63.2 1.24.56 1.75l.52.78H3.42l.52-.78c.36-.51.56-1.12.56-1.75V6.75A4.5 4.5 0 019 2.25z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.35"
          />
          <path
            d="M6.75 13.5h4.5a1.5 1.5 0 01-3 0z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.35"
          />
        </svg>
      );
    case 'comment':
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M3.5 3.5h11v8.5H6.2L3.5 15.2V3.5z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.35"
          />
          <path
            d="M6 7.5h6M6 10h4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.35"
          />
        </svg>
      );
    case 'gift':
      return (
        <svg aria-hidden fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path
            d="M3.5 8.25h11v3.5h-11V8.25zM9 8.25V15M6.25 5.5c0-1 1-2 2.75-2s2.75 1 2.75 2v2.75H6.25V5.5zM3.5 5.5h4.75M9.75 5.5H14.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.25"
          />
        </svg>
      );
    default:
      return null;
  }
}

function NotificationCard({
  item,
  markingRead,
  onMarkRead,
  onOpen,
}: {
  item: AppNotification;
  markingRead: boolean;
  onMarkRead: (item: AppNotification) => void;
  onOpen: (item: AppNotification) => void;
}) {
  const hasThumb = Boolean(item.thumbUrl);
  const hasCta = Boolean(item.cta);
  const unread = item.read !== true;
  const canOpen = Boolean(item.detailPath ?? item.cta?.href);

  return (
    <article
      className={`notifications__card${unread ? ' notifications__card--unread' : ' notifications__card--read'}${canOpen ? ' notifications__card--actionable' : ''}`}
      role="listitem"
    >
      <button
        type="button"
        className="notifications__card-main"
        onClick={() => onOpen(item)}
        aria-label={`${item.message} ${unread ? '읽지 않음' : '읽음'}`}
      >
        <span className="notifications__unread-dot" aria-hidden />
        <div className="notifications__card-inner">
          <div className="notifications__icon-wrap" aria-hidden>
            <NotificationGlyph kind={item.icon} />
          </div>
          <div
            className={`notifications__body${hasCta ? '' : ' notifications__body--tight'}`}
          >
            <div>
              <p className="notifications__message">{item.message}</p>
              <p className="notifications__time">{item.timeLabel}</p>
            </div>
            {item.cta ? (
              <span className="notifications__cta">
                {item.cta.label}
              </span>
            ) : null}
          </div>
        </div>
        {hasThumb ? (
          <img
            alt=""
            className="notifications__thumb"
            height={60}
            src={item.thumbUrl}
            width={60}
            loading="lazy"
          />
        ) : null}
      </button>
      {unread ? (
        <button
          type="button"
          className="notifications__read-btn"
          disabled={markingRead}
          onClick={() => onMarkRead(item)}
        >
          {markingRead ? '처리중' : '읽음'}
        </button>
      ) : (
        <span className="notifications__read-state">읽음</span>
      )}
    </article>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<NotificationTabFilter>('all');
  const [items, setItems] = useState<readonly AppNotification[]>(
    isMockMode() ? APP_NOTIFICATIONS : [],
  );
  const [loading, setLoading] = useState<boolean>(!isMockMode());
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [markingReadIds, setMarkingReadIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    if (isMockMode()) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchNotifications(0, 50)
      .then((page) => {
        if (cancelled) return;
        setItems(notificationsFromApiPage(page));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err : new Error('알림 조회 실패'));
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const { todayItems, weekItems } = useMemo(() => {
    const filtered = filterNotifications(items, tab);
    return {
      todayItems: filtered.filter((n) => n.section === 'today'),
      weekItems: filtered.filter((n) => n.section === 'week'),
    };
  }, [items, tab]);
  const unreadItemCount = useMemo(
    () => items.filter((item) => item.read !== true).length,
    [items],
  );

  const markItemRead = useCallback(async (item: AppNotification) => {
    if (item.read === true || markingReadIds.has(item.id)) {
      return;
    }

    setActionError(null);
    if (isMockMode()) {
      setItems((prev) =>
        prev.map((candidate) =>
          candidate.id === item.id ? { ...candidate, read: true } : candidate,
        ),
      );
      return;
    }

    setMarkingReadIds((prev) => new Set(prev).add(item.id));
    try {
      await markNotificationRead(item.id);
      setItems((prev) =>
        prev.map((candidate) =>
          candidate.id === item.id ? { ...candidate, read: true } : candidate,
        ),
      );
      emitNotificationUnreadCountChange({ delta: -1 });
    } catch {
      setActionError('알림 읽음 처리에 실패했습니다.');
    } finally {
      setMarkingReadIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [markingReadIds]);

  const openNotification = useCallback(
    (item: AppNotification) => {
      const destination = item.detailPath ?? item.cta?.href;
      void markItemRead(item);
      if (destination) {
        navigate(destination);
      }
    },
    [markItemRead, navigate],
  );

  const markAllRead = useCallback(async () => {
    if (unreadItemCount === 0 || markingAllRead) {
      return;
    }

    setActionError(null);
    if (isMockMode()) {
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      return;
    }

    setMarkingAllRead(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      emitNotificationUnreadCountChange({ count: 0 });
    } catch {
      setActionError('전체 읽음 처리에 실패했습니다.');
    } finally {
      setMarkingAllRead(false);
    }
  }, [markingAllRead, unreadItemCount]);

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

  const demoEmpty = searchParams.get('empty') === '1';
  const empty =
    !loading &&
    (demoEmpty ||
      Boolean(loadError) ||
      (todayItems.length === 0 && weekItems.length === 0));

  return (
    <main className="notifications-page">
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

      <div className="notifications-page__main">
        <div className="notifications">
          <div className="notifications__head">
            <h1 className="notifications__title">알림</h1>
            <button
              type="button"
              className="notifications__mark-all"
              disabled={unreadItemCount === 0 || markingAllRead}
              onClick={markAllRead}
            >
              {markingAllRead ? '처리중' : '모두 읽음'}
            </button>
          </div>

          <div
            className="notifications__tabs"
            role="tablist"
            aria-label="알림 유형"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`notifications__tab${tab === t.id ? ' notifications__tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {actionError ? (
            <p className="notifications__error" role="alert">
              {actionError}
            </p>
          ) : null}

          {empty ? (
            <div className="notifications__empty-state" role="status">
              <NotificationsEmptyBell />
              <p className="notifications__empty-message">
                아직 온 알림이 없습니다.
              </p>
            </div>
          ) : (
            <div className="notifications__stack">
              {todayItems.length > 0 ? (
                <section
                  className="notifications__section notifications__section--today"
                  aria-labelledby="notifications-today-heading"
                >
                  <h2
                    className="notifications__section-title"
                    id="notifications-today-heading"
                  >
                    오늘
                  </h2>
                  <div className="notifications__section-list" role="list">
                    {todayItems.map((item) => (
                      <NotificationCard
                        item={item}
                        key={item.id}
                        markingRead={markingReadIds.has(item.id)}
                        onMarkRead={markItemRead}
                        onOpen={openNotification}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {weekItems.length > 0 ? (
                <section
                  className="notifications__section notifications__section--week"
                  aria-labelledby="notifications-week-heading"
                >
                  <h2
                    className="notifications__section-title"
                    id="notifications-week-heading"
                  >
                    이번주
                  </h2>
                  <div className="notifications__section-list" role="list">
                    {weekItems.map((item) => (
                      <NotificationCard
                        item={item}
                        key={item.id}
                        markingRead={markingReadIds.has(item.id)}
                        onMarkRead={markItemRead}
                        onOpen={openNotification}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
