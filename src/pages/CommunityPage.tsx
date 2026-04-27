import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import { useCommunityFeed } from '../hooks/useCommunityFeed';

export function CommunityPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const {
    activeCategory,
    categoryOptions,
    errorMessage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage,
    hasPreviousPage,
    items,
    loading,
    page,
    selectedSortOption,
    setCategory,
    setSortOption,
    sortOptions,
    totalCount,
  } = useCommunityFeed();

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
                onClick={() => setCategory(label)}
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
              {selectedSortOption.label}
              <span className="community-page__sort-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            {sortOpen ? (
              <div className="community-page__sort-menu" role="listbox">
                {sortOptions.map((option) => (
                  <button
                    aria-selected={option.value === selectedSortOption.value}
                    className="community-page__sort-option"
                    key={option.value}
                    onClick={() => {
                      setSortOption(option.value);
                      setSortOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="community-page__summary">
          <span className="community-page__count">총 {totalCount.toLocaleString('ko-KR')}개</span>
          <span className="community-page__page-indicator">{page + 1}페이지</span>
        </div>

        {loading ? (
          <div className="community-page__feedback" role="status">
            커뮤니티 글을 불러오는 중입니다.
          </div>
        ) : errorMessage ? (
          <div className="community-page__feedback community-page__feedback--error" role="alert">
            {errorMessage}
          </div>
        ) : items.length === 0 ? (
          <div className="community-page__feedback community-page__feedback--empty">
            아직 등록된 게시글이 없습니다.
          </div>
        ) : (
          <div className="community-page__grid">
            {items.map((item) => {
              const cardInner = (
                <>
                  {item.thumbnail ? (
                    <div
                      aria-hidden
                      className="community-page__thumb"
                      style={
                        /^https?:\/\//.test(item.thumbnail)
                          ? { background: `#eee url(${item.thumbnail}) center / cover` }
                          : { background: item.thumbnail }
                      }
                    />
                  ) : null}
                  <div className="community-page__card-body">
                    <span className="community-page__category">{item.category}</span>
                    <h2 className="community-page__card-title">{item.title}</h2>
                    {item.excerpt ? <p className="community-page__excerpt">{item.excerpt}</p> : null}
                    <div className="community-page__meta">
                      <span>{item.authorNickname}</span>
                      <span>{item.postedAtLabel}</span>
                      <span>♥ {item.likes}</span>
                      <span>• {item.commentCount}</span>
                    </div>
                  </div>
                </>
              );
              const cardClass = `community-page__card${item.detailSlug ? ' community-page__card--link' : ''}`;
              return item.detailSlug ? (
                <Link className={cardClass} key={item.id} to={`/community/post/${item.detailSlug}`}>
                  {cardInner}
                </Link>
              ) : (
                <article className={cardClass} key={item.id}>
                  {cardInner}
                </article>
              );
            })}
          </div>
        )}

        <div aria-label="커뮤니티 페이지네이션" className="community-page__pagination">
          <button
            className="community-page__page-button"
            disabled={loading || !hasPreviousPage}
            onClick={goToPreviousPage}
            type="button"
          >
            이전 페이지
          </button>
          <button
            className="community-page__page-button"
            disabled={loading || !hasNextPage}
            onClick={goToNextPage}
            type="button"
          >
            다음 페이지
          </button>
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
