import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSpaceExplorer } from '../components/home/HomeSpaceExplorer';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { COMMUNITY_SORT_OPTIONS, COMMUNITY_FEED_ITEMS } from '../data/communityFeed';
import { loadAuthSession } from '../data/authSession';
import {
  searchRooms,
  searchVendors,
  searchPosts,
  type VendorSearchItem,
  type PostSearchItem,
} from '../api/search';
import { isMockMode } from '../config/publicEnv';

const MOCK_VENDOR_RESULTS = [
  { name: '유스뮤직', slug: 'youth-music', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #7f1315, #e26447)' },
  { name: '방구석 뮤지션의 합주실', slug: 'banggu-musician', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #6b4d24, #c5a071)' },
  { name: '챗츠뮤직', slug: 'chats-music', spaces: '15개의 공간', tone: 'linear-gradient(135deg, #bcbcbc, #ececec)' },
];

type SearchTab = 'community' | 'space' | 'vendor';

const SPACE_SORT_OPTIONS = ['LATEST', 'POPULARITY', 'PRICE_ASC', 'PRICE_DESC'] as const;
const SPACE_SORT_LABELS: Record<string, string> = {
  LATEST: '최신순',
  POPULARITY: '예약 많은 순',
  PRICE_ASC: '가격 낮은 순',
  PRICE_DESC: '가격 높은 순',
};

const VENDOR_SORT_OPTIONS = ['relevance'] as const;
const VENDOR_SORT_LABELS: Record<string, string> = {
  relevance: '정확도순',
};

const SEARCH_SORT_OPTIONS: Record<SearchTab, readonly string[]> = {
  community: COMMUNITY_SORT_OPTIONS,
  space: SPACE_SORT_OPTIONS,
  vendor: VENDOR_SORT_OPTIONS,
};

const SEARCH_SORT_DEFAULT: Record<SearchTab, string> = {
  community: '최신순',
  space: 'LATEST',
  vendor: 'relevance',
};

function sortLabel(tab: SearchTab, value: string): string {
  if (tab === 'space') return SPACE_SORT_LABELS[value] ?? value;
  if (tab === 'vendor') return VENDOR_SORT_LABELS[value] ?? value;
  return value;
}

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

  const [roomsTotalCount, setRoomsTotalCount] = useState<number | null>(null);

  const [vendors, setVendors] = useState<VendorSearchItem[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsTotalCount, setVendorsTotalCount] = useState<number | null>(null);

  const [posts, setPosts] = useState<PostSearchItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsTotalCount, setPostsTotalCount] = useState<number | null>(null);

  useEffect(() => {
    setHeaderSearchQuery(query);
  }, [query]);

  useEffect(() => {
    setSortBy(SEARCH_SORT_DEFAULT[activeTab]);
    setSortOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (isMockMode()) return;

    if (activeTab === 'space') {
      searchRooms({ q: query, sort: sortBy, size: 20 })
        .then((res) => setRoomsTotalCount(res.totalElements));
    }

    if (activeTab === 'vendor') {
      setVendorsLoading(true);
      searchVendors({ q: query, sort: sortBy, size: 20 })
        .then((res) => {
          setVendors(res.items);
          setVendorsTotalCount(res.totalCount);
        })
        .finally(() => setVendorsLoading(false));
    }

    if (activeTab === 'community') {
      setPostsLoading(true);
      searchPosts({ q: query, size: 20 })
        .then((res) => {
          setPosts(res.items);
          setPostsTotalCount(res.totalCount);
        })
        .finally(() => setPostsLoading(false));
    }
  }, [query, activeTab, sortBy]);

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

  const resultCountLabel = isMockMode()
    ? activeTab === 'space'
      ? '4개의 공간'
      : activeTab === 'vendor'
        ? '3개의 업체'
        : COMMUNITY_FEED_ITEMS.length + '개의 글'
    : activeTab === 'space'
      ? roomsTotalCount !== null
        ? `${roomsTotalCount}개의 공간`
        : '공간'
      : activeTab === 'vendor'
        ? vendorsTotalCount !== null
          ? `${vendorsTotalCount}개의 업체`
          : '업체'
        : postsTotalCount !== null
          ? `${postsTotalCount}개의 게시글`
          : '게시글';

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
        <h1 className="search-results__title">'{query}' 검색 결과</h1>

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
              <span>{sortLabel(activeTab, sortBy)}</span>
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
                    <span>{sortLabel(activeTab, option)}</span>
                    {sortBy === option ? <span className="search-results__sort-check">✓</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {activeTab === 'space' ? (
          <HomeSpaceExplorer resultLimit={20} variant="section" />
        ) : null}

        {activeTab === 'vendor' ? (
          vendorsLoading ? (
            <div className="search-results__loading">로딩 중...</div>
          ) : isMockMode() ? (
            <div className="search-results__vendor-grid">
              {MOCK_VENDOR_RESULTS.map((vendor) => (
                <Link className="search-results__vendor-card search-results__vendor-card--link" key={vendor.slug} to={`/vendors/${vendor.slug}`}>
                  <div
                    className="search-results__vendor-avatar"
                    style={{ background: vendor.tone }}
                  />
                  <div className="search-results__vendor-body">
                    <h2 className="search-results__vendor-name">{vendor.name}</h2>
                    <p className="search-results__vendor-meta">{vendor.spaces}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="search-results__vendor-grid">
              {vendors.map((vendor) => (
                <Link className="search-results__vendor-card search-results__vendor-card--link" key={vendor.id} to={`/vendors/${vendor.id}`}>
                  <div
                    className="search-results__vendor-avatar"
                    style={vendor.thumbnailUrl ? { backgroundImage: `url(${vendor.thumbnailUrl})`, backgroundSize: 'cover' } : undefined}
                  />
                  <div className="search-results__vendor-body">
                    <h2 className="search-results__vendor-name">{vendor.name}</h2>
                    <p className="search-results__vendor-meta">{vendor.address}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : null}

        {activeTab === 'community' ? (
          postsLoading ? (
            <div className="search-results__loading">로딩 중...</div>
          ) : isMockMode() ? (
            <div className="search-results__community-list">
              {COMMUNITY_FEED_ITEMS.map((post, index) => (
                <article className="search-results__community-card" key={index}>
                  <div className="search-results__community-copy">
                    <h2 className="search-results__community-title">{post.title}</h2>
                    <div className="search-results__community-meta">
                      <span>{post.category}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="search-results__community-list">
              {posts.map((post) => (
                <article className="search-results__community-card" key={post.id}>
                  <div className="search-results__community-copy">
                    <h2 className="search-results__community-title">{post.title}</h2>
                    <div className="search-results__community-meta">
                      <span>{post.authorUserId}</span>
                      <span>{post.createdAt}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}
      </section>

      <HomeFooter />
    </main>
  );
}
