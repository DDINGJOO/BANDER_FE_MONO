import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  MY_SCRAP_RECENT,
  MY_SCRAP_SAVED,
  type MyScrapCard as MyScrapCardModel,
} from '../data/myScraps';

type TabKey = 'saved' | 'recent';

function ScrapBookmarkGlyph({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden fill="none" height={28} viewBox="0 0 28 28" width={28}>
      <path
        d="M9 6.5C9 5.67 9.67 5 10.5 5H17.5C18.33 5 19 5.67 19 6.5V22L14 18.3L9 22V6.5Z"
        fill={filled ? '#24262c' : 'rgba(0,0,0,0.36)'}
        stroke={filled ? '#24262c' : 'rgba(255,255,255,0.75)'}
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function ScrapStarGlyph() {
  return (
    <svg aria-hidden fill="none" height={14} viewBox="0 0 14 14" width={14}>
      <path
        d="M7 1.8l1.65 4.05 4.35.34-3.35 2.84 1.04 4.24L7 11.12l-3.69 2.15L4.35 9l-3.35-2.84 4.35-.34L7 1.8z"
        fill="#FFA20C"
        stroke="#FFA20C"
        strokeLinejoin="round"
        strokeWidth={0.8}
      />
    </svg>
  );
}

function MyScrapCard({
  item,
  onToggleScrap,
}: {
  item: MyScrapCardModel;
  onToggleScrap: (detailPath: string) => void;
}) {
  return (
    <article className="my-scraps-card">
      <div className="my-scraps-card__thumb-wrap">
        <Link className="my-scraps-card__thumb-link" to={item.detailPath}>
          <img
            alt=""
            className="my-scraps-card__thumb"
            loading="lazy"
            src={item.imageUrl}
          />
        </Link>
        <button
          aria-label={item.bookmarkSaved ? '스크랩 해제' : '스크랩'}
          aria-pressed={item.bookmarkSaved}
          className="my-scraps-card__scrap"
          onClick={() => onToggleScrap(item.detailPath)}
          type="button"
        >
          <ScrapBookmarkGlyph filled={item.bookmarkSaved} />
        </button>
      </div>

      <div className="my-scraps-card__body">
        <div className="my-scraps-card__head">
          <div className="my-scraps-card__tags">
            <span className="my-scraps-card__tag">{item.spaceType}</span>
            <span aria-hidden className="my-scraps-card__dot" />
            <span className="my-scraps-card__tag">{item.studio}</span>
          </div>
          <Link className="my-scraps-card__title-link" to={item.detailPath}>
            <h3 className="my-scraps-card__title">{item.title}</h3>
          </Link>
          <div className="my-scraps-card__meta">
            <span className="my-scraps-card__rating">
              <ScrapStarGlyph />
              <span className="my-scraps-card__rating-num">{item.rating}</span>
            </span>
            <span aria-hidden className="my-scraps-card__dot my-scraps-card__dot--muted" />
            <span className="my-scraps-card__location">{item.location}</span>
          </div>
        </div>

        <div className="my-scraps-card__foot">
          <div className="my-scraps-card__price">
            <span className="my-scraps-card__price-value">{item.priceLabel}</span>
            <span className="my-scraps-card__price-suffix">{item.priceSuffix}</span>
          </div>
          <div className="my-scraps-card__chips">
            <span className="my-scraps-card__chip">{item.tags[0]}</span>
            <span aria-hidden className="my-scraps-card__dot" />
            <span className="my-scraps-card__chip">{item.tags[1]}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MyScrapsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('saved');

  /**
   * 저장 탭과 최근 본 탭은 같은 공간을 중복 노출할 수 있으므로(예: Moon 합주실 룸),
   * 스크랩 여부는 detailPath를 키로 한 단일 savedSet으로 관리하고, 두 탭 리스트는
   * 아래 catalog / savedOrder / recentOrder로부터 파생시킨다.
   */
  const catalog = useMemo<Record<string, MyScrapCardModel>>(() => {
    const map: Record<string, MyScrapCardModel> = {};
    for (const row of [...MY_SCRAP_SAVED, ...MY_SCRAP_RECENT]) {
      if (!map[row.detailPath]) map[row.detailPath] = row;
    }
    return map;
  }, []);

  const recentOrder = useMemo(() => MY_SCRAP_RECENT.map((row) => row.detailPath), []);

  const [savedOrder, setSavedOrder] = useState<string[]>(() =>
    MY_SCRAP_SAVED.filter((row) => row.bookmarkSaved).map((row) => row.detailPath),
  );
  const [savedSet, setSavedSet] = useState<Set<string>>(
    () => new Set(MY_SCRAP_SAVED.filter((row) => row.bookmarkSaved).map((row) => row.detailPath)),
  );

  const toggleScrap = useCallback((detailPath: string) => {
    setSavedSet((prev) => {
      const next = new Set(prev);
      if (next.has(detailPath)) {
        next.delete(detailPath);
      } else {
        next.add(detailPath);
      }
      return next;
    });
    setSavedOrder((prev) => {
      if (prev.includes(detailPath)) {
        return prev.filter((p) => p !== detailPath);
      }
      return [detailPath, ...prev];
    });
  }, []);

  const savedItems = useMemo<MyScrapCardModel[]>(
    () =>
      savedOrder
        .map((path) => catalog[path])
        .filter((row): row is MyScrapCardModel => Boolean(row))
        .map((row) => ({ ...row, bookmarkSaved: true })),
    [catalog, savedOrder],
  );

  const recentItems = useMemo<MyScrapCardModel[]>(
    () =>
      recentOrder.map((path) => {
        const row = catalog[path];
        return { ...row, bookmarkSaved: savedSet.has(path) };
      }),
    [catalog, recentOrder, savedSet],
  );

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

  const activeItems = activeTab === 'saved' ? savedItems : recentItems;

  return (
    <main className="my-scraps-page">
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

      <div className="my-scraps-page__main">
        <section className="my-scraps">
          <h1 className="my-scraps__title">내 스크랩</h1>

          <div className="my-scraps__tabs" role="tablist">
            <button
              aria-selected={activeTab === 'saved'}
              className={`my-scraps__tab${activeTab === 'saved' ? ' my-scraps__tab--active' : ''}`}
              onClick={() => setActiveTab('saved')}
              role="tab"
              type="button"
            >
              저장 {savedItems.length}
            </button>
            <button
              aria-selected={activeTab === 'recent'}
              className={`my-scraps__tab${activeTab === 'recent' ? ' my-scraps__tab--active' : ''}`}
              onClick={() => setActiveTab('recent')}
              role="tab"
              type="button"
            >
              최근 본 {recentItems.length}
            </button>
          </div>

          {activeItems.length === 0 ? (
            <p className="my-scraps__empty">
              {activeTab === 'saved'
                ? '저장한 공간이 없습니다.'
                : '최근에 본 공간이 없습니다.'}
            </p>
          ) : (
            <div className="my-scraps__grid" role="tabpanel">
              {activeItems.map((item) => (
                <MyScrapCard item={item} key={item.id} onToggleScrap={toggleScrap} />
              ))}
            </div>
          )}
        </section>
      </div>

      <HomeFooter />
    </main>
  );
}
