import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  COMMUNITY_FEED_ITEMS,
  COMMUNITY_SORT_OPTIONS,
  getCommunityCategoryFilters,
} from '../data/communityFeed';

export function CommunityPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>(COMMUNITY_SORT_OPTIONS[0]);
  const categoryOptions = getCommunityCategoryFilters(COMMUNITY_FEED_ITEMS);
  const [activeCategory, setActiveCategory] = useState(categoryOptions[0] ?? '전체');

  const visibleItems =
    activeCategory === '전체'
      ? COMMUNITY_FEED_ITEMS
      : COMMUNITY_FEED_ITEMS.filter((row) => row.category === activeCategory);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!headerSearchRef.current?.contains(target)) {
        setHeaderSearchOpen(false);
      }
      if (!sortRef.current?.contains(target)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <main className="community-page">
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
        onSearchSubmit={handleSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          handleSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div aria-label="커뮤니티 카테고리" className="community-page__wash" role="region">
        <div className="community-page__wash-inner">
          <div className="community-page__chips">
            {categoryOptions.map((label) => (
              <button
                className={
                  label === activeCategory
                    ? 'community-page__chip community-page__chip--active'
                    : 'community-page__chip'
                }
                key={label}
                onClick={() => setActiveCategory(label)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="community-page__main">
        <div className="community-page__toolbar">
          <h1 className="community-page__title">전체 커뮤니티</h1>
          <div className="community-page__sort-wrap" ref={sortRef}>
            <button
              aria-expanded={sortOpen}
              className="community-page__sort-button"
              onClick={() => setSortOpen((o) => !o)}
              type="button"
            >
              {sortBy}
              <span className="community-page__sort-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            {sortOpen ? (
              <div className="community-page__sort-menu" role="listbox">
                {COMMUNITY_SORT_OPTIONS.map((opt) => (
                  <button
                    className="community-page__sort-option"
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setSortOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="community-page__grid">
          {visibleItems.map((item) => {
            const cardInner = (
              <>
                {item.thumbnail ? (
                  <div
                    aria-hidden
                    className="community-page__thumb"
                    style={
                      item.thumbnail.startsWith('http')
                        ? { background: `#eee url(${item.thumbnail}) center / cover` }
                        : { background: item.thumbnail }
                    }
                  />
                ) : null}
                <div className="community-page__card-body">
                  <span className="community-page__category">{item.category}</span>
                  <h2 className="community-page__card-title">{item.title}</h2>
                  <p className="community-page__excerpt">{item.excerpt}</p>
                  <div className="community-page__meta">
                    <span>neowmeow</span>
                    <span>방금</span>
                    <span>♥ {item.likes}</span>
                    <span>• 2</span>
                  </div>
                </div>
              </>
            );
            const cardClass = `community-page__card${item.detailSlug ? ' community-page__card--link' : ''}`;
            return item.detailSlug ? (
              <Link className={cardClass} key={item.title} to={`/community/post/${item.detailSlug}`}>
                {cardInner}
              </Link>
            ) : (
              <article className={cardClass} key={item.title}>
                {cardInner}
              </article>
            );
          })}
        </div>
      </div>

      <button
        className="community-page__fab"
        onClick={() => navigate('/community/write')}
        type="button"
      >
        글쓰기
      </button>

      <HomeFooter />
    </main>
  );
}
