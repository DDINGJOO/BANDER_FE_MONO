import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  EVENT_LIST,
  NOTICE_LIST,
  type NoticeCategory,
  type NoticeListItem,
  type NoticeTab,
  type EventStatus,
} from '../data/notices';

const NOTICE_FILTERS: readonly { key: 'ALL' | NoticeCategory; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: '공지', label: '공지' },
  { key: '업데이트', label: '업데이트' },
  { key: '정보', label: '정보' },
  { key: '기타', label: '기타' },
];

const EVENT_FILTERS: readonly { key: 'ALL' | EventStatus; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: '진행중', label: '진행중' },
  { key: '종료', label: '종료' },
];

function CategoryBadge({ item }: { item: NoticeListItem }) {
  if (item.tab === 'NOTICE') {
    const tone =
      item.category === '공지'
        ? 'notices-badge--notice'
        : item.category === '업데이트'
          ? 'notices-badge--update'
          : item.category === '정보'
            ? 'notices-badge--info'
            : 'notices-badge--etc';
    return <span className={`notices-badge ${tone}`}>{item.category ?? ''}</span>;
  }

  // EVENT
  if (item.status === '종료') {
    return <span className="notices-badge notices-badge--ended">종료</span>;
  }
  return (
    <span className="notices-badge-group">
      <span className="notices-badge notices-badge--ongoing">진행중</span>
      {item.dDayLabel ? (
        <span className="notices-badge notices-badge--dday">{item.dDayLabel}</span>
      ) : null}
    </span>
  );
}

function NoticeRow({ item }: { item: NoticeListItem }) {
  return (
    <li className="notices-row">
      <Link className="notices-row__link" to={`/notices/${item.slug}`}>
        <div className="notices-row__main">
          <CategoryBadge item={item} />
          <span className="notices-row__title">{item.title}</span>
        </div>
        <span className="notices-row__date">{item.dateLabel}</span>
      </Link>
    </li>
  );
}

export function NoticesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const tab: NoticeTab = search.get('tab') === 'event' ? 'EVENT' : 'NOTICE';
  const [noticeFilter, setNoticeFilter] = useState<'ALL' | NoticeCategory>('ALL');
  const [eventFilter, setEventFilter] = useState<'ALL' | EventStatus>('ALL');

  const filteredSuggestions = useMemo(
    () =>
      HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
        item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
      ),
    [headerSearchQuery],
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search/map?q=${encodeURIComponent(q)}`);
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

  const items = useMemo<NoticeListItem[]>(() => {
    if (tab === 'NOTICE') {
      return noticeFilter === 'ALL'
        ? NOTICE_LIST
        : NOTICE_LIST.filter((r) => r.category === noticeFilter);
    }
    return eventFilter === 'ALL'
      ? EVENT_LIST
      : EVENT_LIST.filter((r) => r.status === eventFilter);
  }, [tab, noticeFilter, eventFilter]);

  const onTabChange = (next: NoticeTab) => {
    const nextSearch = new URLSearchParams(search);
    if (next === 'EVENT') {
      nextSearch.set('tab', 'event');
    } else {
      nextSearch.delete('tab');
    }
    setSearch(nextSearch);
  };

  return (
    <main className="notices-page">
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
        onSearchFocus={() => setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))}
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="notices-page__main">
        <section className="notices">
          <h1 className="notices__title">공지사항/이벤트</h1>

          <div className="notices__tabs" role="tablist" aria-label="공지사항/이벤트 탭">
            <button
              aria-selected={tab === 'NOTICE'}
              className={`notices__tab${tab === 'NOTICE' ? ' notices__tab--active' : ''}`}
              onClick={() => onTabChange('NOTICE')}
              role="tab"
              type="button"
            >
              공지사항
            </button>
            <button
              aria-selected={tab === 'EVENT'}
              className={`notices__tab${tab === 'EVENT' ? ' notices__tab--active' : ''}`}
              onClick={() => onTabChange('EVENT')}
              role="tab"
              type="button"
            >
              이벤트
            </button>
          </div>

          <div className="notices__filters" role="tablist" aria-label="필터">
            {(tab === 'NOTICE' ? NOTICE_FILTERS : EVENT_FILTERS).map((opt) => {
              const active =
                tab === 'NOTICE' ? noticeFilter === opt.key : eventFilter === opt.key;
              return (
                <button
                  aria-selected={active}
                  className={`notices__filter${active ? ' notices__filter--active' : ''}`}
                  key={opt.key}
                  onClick={() => {
                    if (tab === 'NOTICE') {
                      setNoticeFilter(opt.key as 'ALL' | NoticeCategory);
                    } else {
                      setEventFilter(opt.key as 'ALL' | EventStatus);
                    }
                  }}
                  role="tab"
                  type="button"
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {items.length === 0 ? (
            <p className="notices__empty">게시물이 없습니다.</p>
          ) : (
            <ul className="notices__list" role="tabpanel">
              {items.map((row) => (
                <NoticeRow item={row} key={row.id} />
              ))}
            </ul>
          )}

          <nav aria-label="페이지" className="notices__pagination">
            <span aria-current="page" className="notices__page notices__page--active">
              1
            </span>
            <button className="notices__page" type="button">
              2
            </button>
            <button className="notices__page" type="button">
              3
            </button>
          </nav>
        </section>
      </div>

      <HomeFooter />
    </main>
  );
}
