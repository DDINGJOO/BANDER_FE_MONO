import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeSpaceExplorer, type SpaceFilterState } from '../components/home/HomeSpaceExplorer';
import { ChevronIcon } from '../components/shared/Icons';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { COMMUNITY_SORT_OPTIONS, COMMUNITY_FEED_ITEMS } from '../data/communityFeed';
import { loadAuthSession } from '../data/authSession';
import {
  searchRooms,
  searchVendors,
  searchPosts,
  type RoomSearchItem,
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

const VENDOR_SORT_OPTIONS = ['relevance', 'popular', 'latest'] as const;
const VENDOR_SORT_LABELS: Record<string, string> = {
  relevance: '정확도순',
  popular: '인기순',
  latest: '최신순',
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

function formatPostDateLabel(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return value;
  }

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return '방금 전';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  if (diffMs < day * 7) return `${Math.floor(diffMs / day)}일 전`;

  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(timestamp));
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

  const [rooms, setRooms] = useState<RoomSearchItem[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsTotalCount, setRoomsTotalCount] = useState<number | null>(null);

  const [vendors, setVendors] = useState<VendorSearchItem[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsTotalCount, setVendorsTotalCount] = useState<number | null>(null);

  const [posts, setPosts] = useState<PostSearchItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsTotalCount, setPostsTotalCount] = useState<number | null>(null);

  const spaceFiltersRef = useRef<SpaceFilterState>({});
  const [spaceFilterKey, setSpaceFilterKey] = useState(0);

  const handleFilterChange = useCallback((filters: SpaceFilterState) => {
    const prev = JSON.stringify(spaceFiltersRef.current);
    const next = JSON.stringify(filters);
    if (prev === next) return;
    spaceFiltersRef.current = filters;
    setSpaceFilterKey((k) => k + 1);
  }, []);

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
      setRoomsLoading(true);
      const sf = spaceFiltersRef.current;
      const cleanKeywords = sf.keywords?.map((k) => k.replace(/^#/, '')) ?? [];
      const filterQuery = cleanKeywords.length
        ? [query, ...cleanKeywords].filter(Boolean).join(' ')
        : query;
      searchRooms({
        q: filterQuery,
        category: sf.category,
        region: sf.regions?.length ? sf.regions[0] : undefined,
        capacity: sf.capacity,
        parking: sf.parking,
        sort: sortBy,
        size: 20,
      })
        .then((res) => {
          setRooms(res.rooms);
          setRoomsTotalCount(res.totalElements);
        })
        .finally(() => setRoomsLoading(false));
    }

    if (activeTab === 'vendor') {
      setVendorsLoading(true);
      searchVendors({ q: query, sort: sortBy, size: 20 })
        .then((res) => {
          setVendors(res.items);
          setVendorsTotalCount(res.totalCount ?? null);
        })
        .finally(() => setVendorsLoading(false));
    }

    if (activeTab === 'community') {
      setPostsLoading(true);
      searchPosts({ q: query, size: 20 })
        .then((res) => {
          setPosts(res.items);
          setPostsTotalCount(res.totalCount ?? null);
        })
        .finally(() => setPostsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab, sortBy, spaceFilterKey]);

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

  const { suggestions: filteredSuggestions } = useSearchSuggestions(headerSearchQuery);

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
          isMockMode() ? (
            <HomeSpaceExplorer onFilterChange={handleFilterChange} resultLimit={20} variant="section" />
          ) : (
            <HomeSpaceExplorer
              onFilterChange={handleFilterChange}
              resultLimit={20}
              spaces={roomsLoading ? [] : rooms.map((r) => ({
                title: r.roomName,
                subtitle: r.description || '',
                studio: r.studioName,
                location: r.roadAddress || '',
                price: `${r.pricePerSlot.toLocaleString()}원`,
                rating: '',
                image: r.thumbnailUrl || '',
                detailPath: `/spaces/${r.roomSlug || r.roomId}`,
              }))}
              variant="section"
            />
          )
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
                <Link className="search-results__vendor-card search-results__vendor-card--link" key={vendor.id} to={`/vendors/${vendor.slug || vendor.id}`}>
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
                <Link className="search-results__community-card search-results__community-card--link" key={post.id} to={`/community/post/${post.id}`}>
                  <div className="search-results__community-copy">
                    {post.category ? (
                      <span className="search-results__community-category">{post.category}</span>
                    ) : null}
                    <h2 className="search-results__community-title">{post.title}</h2>
                    {post.excerpt ? (
                      <p className="search-results__community-excerpt">{post.excerpt}</p>
                    ) : null}
                    <div className="search-results__community-meta">
                      <span>{post.authorNickname ?? '밴더유저'}</span>
                      <span>{formatPostDateLabel(post.createdAt)}</span>
                      {typeof post.likeCount === 'number' ? <span>♥ {post.likeCount}</span> : null}
                      {typeof post.commentCount === 'number' ? <span>댓글 {post.commentCount}</span> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : null}
      </section>

      <HomeFooter />
    </main>
  );
}
