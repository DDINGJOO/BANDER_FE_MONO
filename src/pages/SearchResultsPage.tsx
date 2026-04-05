import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSpaceExplorer } from '../components/home/HomeSpaceExplorer';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import {
  COMMUNITY_FEED_ITEMS,
  COMMUNITY_SORT_OPTIONS,
} from '../data/communityFeed';
import { loadAuthSession } from '../data/authSession';

const SEARCH_VENDOR_RESULTS = [
  { name: '유스뮤직', slug: 'youth-music', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #7f1315, #e26447)' },
  {
    name: '방구석 뮤지션의 합주실',
    slug: 'banggu-musician',
    spaces: '15개의 공간',
    tone: 'linear-gradient(135deg, #6b4d24, #c5a071)',
  },
  { name: '챗츠뮤직', slug: 'chats-music', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #bcbcbc, #ececec)' },
];

type SearchTab = 'community' | 'space' | 'vendor';

const SEARCH_SORT_OPTIONS: Record<SearchTab, string[]> = {
  community: [...COMMUNITY_SORT_OPTIONS],
  space: ['가까운순', '정확도순', '예약 많은 순', '가격 높은 순', '가격 낮은 순'],
  vendor: ['가까운순', '정확도순', '예약 많은 순', '가격 높은 순', '가격 낮은 순'],
};

const SEARCH_SORT_DEFAULT: Record<SearchTab, string> = {
  community: '최신순',
  space: '가까운순',
  vendor: '가까운순',
};

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = Boolean(loadAuthSession());
  const query = searchParams.get('q')?.trim() || '합주';
  const [activeTab, setActiveTab] = useState<SearchTab>('space');
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState(query);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState(SEARCH_SORT_DEFAULT.space);
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHeaderSearchQuery(query);
  }, [query]);

  useEffect(() => {
    setSortBy(SEARCH_SORT_DEFAULT[activeTab]);
    setSortOpen(false);
  }, [activeTab]);

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
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const handleSearchSubmit = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    navigate(`/search?q=${encodeURIComponent(normalizedValue)}`);
  };

  const resultCountLabel =
    activeTab === 'space'
      ? '4개의 공간'
      : activeTab === 'vendor'
        ? '3개의 업체'
        : `${COMMUNITY_FEED_ITEMS.length}개의 게시글`;

  return (
    <main className="search-results-page">
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

      <section className="search-results__inner">
        <h1 className="search-results__title">‘{query}’ 검색 결과</h1>

        <div className="search-results__tabs">
          <button
            className={`search-results__tab ${activeTab === 'space' ? 'search-results__tab--active' : ''}`}
            onClick={() => setActiveTab('space')}
            type="button"
          >
            공간
          </button>
          <button
            className={`search-results__tab ${activeTab === 'vendor' ? 'search-results__tab--active' : ''}`}
            onClick={() => setActiveTab('vendor')}
            type="button"
          >
            업체
          </button>
          <button
            className={`search-results__tab ${activeTab === 'community' ? 'search-results__tab--active' : ''}`}
            onClick={() => setActiveTab('community')}
            type="button"
          >
            커뮤니티
          </button>
        </div>

        <div className="search-results__summary" ref={sortRef}>
          <p className="search-results__count">{resultCountLabel}</p>
          <div className="search-results__sort-wrap">
            <button
              className="search-results__sort"
              onClick={() => setSortOpen((current) => !current)}
              type="button"
            >
              <span>{sortBy}</span>
              <ChevronIcon />
            </button>

            {sortOpen ? (
              <div className="search-results__sort-menu">
                {SEARCH_SORT_OPTIONS[activeTab].map((option) => (
                  <button
                    className={`search-results__sort-option ${sortBy === option ? 'search-results__sort-option--active' : ''}`}
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    <span>{option}</span>
                    {sortBy === option ? <span className="search-results__sort-check">✓</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {activeTab === 'space' ? (
          <HomeSpaceExplorer resultLimit={4} variant="section" />
        ) : null}

        {activeTab === 'vendor' ? (
          <div className="search-results__vendor-grid">
            {SEARCH_VENDOR_RESULTS.map((vendor) => (
              <Link className="search-results__vendor-card search-results__vendor-card--link" key={vendor.slug} to={`/vendors/${vendor.slug}`}>
                <div className="search-results__vendor-avatar" style={{ background: vendor.tone }} />
                <div className="search-results__vendor-body">
                  <h2 className="search-results__vendor-name">{vendor.name}</h2>
                  <p className="search-results__vendor-meta">{vendor.spaces}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {activeTab === 'community' ? (
          <div className="search-results__community-list">
            {COMMUNITY_FEED_ITEMS.map((item) => (
              <article className="search-results__community-card" key={item.title}>
                <div className="search-results__community-copy">
                  <span className="search-results__community-category">{item.category}</span>
                  <h2 className="search-results__community-title">{item.title}</h2>
                  <p className="search-results__community-excerpt">{item.excerpt}</p>
                  <div className="search-results__community-meta">
                    <span>neowmeow</span>
                    <span>방금</span>
                    <span>♥ {item.likes}</span>
                    <span>• 2</span>
                  </div>
                </div>
                {item.thumbnail ? (
                  <div className="search-results__community-thumb" style={{ background: item.thumbnail }} />
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <HomeFooter />
    </main>
  );
}
