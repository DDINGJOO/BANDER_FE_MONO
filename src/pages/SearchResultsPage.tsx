import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import {
  HomeSpaceExplorer,
  type SpaceFilterState,
} from '../components/home/HomeSpaceExplorer';
import { ChevronIcon } from '../components/shared/Icons';
import { KakaoMapView, type KakaoMapBoundsPayload } from '../components/map/KakaoMapView';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { COMMUNITY_SORT_OPTIONS, COMMUNITY_FEED_ITEMS } from '../data/communityFeed';
import { loadAuthSession } from '../data/authSession';
import { EXPLORE_MAP_CENTER } from '../data/exploreMap';
import {
  searchRooms,
  searchVendors,
  searchPosts,
  type RoomSearchItem,
  type VendorSearchItem,
  type PostSearchItem,
} from '../api/search';
import { isMockMode } from '../config/publicEnv';
import { getDayOfWeekParam, parseSearchFilters, serializeSearchFilters } from '../lib/searchQuery';
import {
  bboxToParam,
  boundsCenterDistance,
  boundsDiagonal,
  boundsEqual,
  paramToBbox,
  type Bounds,
  type BoundsWithCenter,
} from '../lib/mapBounds';

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

function buildSearchPath(query: string, filters: SpaceFilterState) {
  const params = serializeSearchFilters(filters, query);
  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : '/search';
}

/** viewport 자동 재검색 임계값 — 사용자가 "충분히 움직였다" 라고 판단하는 기준.
 *  데스크톱 20%, 모바일 30% (한 손 swipe 가 더 크게 잡힘). */
const REFETCH_THRESHOLD_DESKTOP = 0.2;
const REFETCH_THRESHOLD_MOBILE = 0.3;
const VIEWPORT_DEBOUNCE_MS = 350;
const MOBILE_BREAKPOINT_PX = 760;

function pickRefetchThreshold(): number {
  if (typeof window === 'undefined') return REFETCH_THRESHOLD_DESKTOP;
  return window.innerWidth <= MOBILE_BREAKPOINT_PX
    ? REFETCH_THRESHOLD_MOBILE
    : REFETCH_THRESHOLD_DESKTOP;
}

function hasSpaceSearchFilters(filters: SpaceFilterState) {
  return Boolean(
    filters.category ||
    filters.capacity ||
    filters.date ||
    filters.parking ||
    filters.regions?.length ||
    filters.reservable ||
    filters.keywords?.length
  );
}

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamString = searchParams.toString();
  const isAuthenticated = Boolean(loadAuthSession());
  const parsedSearch = useMemo(
    () => parseSearchFilters(new URLSearchParams(searchParamString)),
    [searchParamString]
  );
  const query = parsedSearch.q ?? '';
  const initialSpaceFilters = useMemo(() => parsedSearch.filters, [parsedSearch]);
  const initialSpaceFilterKey = useMemo(() => JSON.stringify(initialSpaceFilters), [initialSpaceFilters]);
  // URL 의 bbox 를 마운트 시점에 한 번만 흡수 — 그 후로는 지도 onBoundsChange 가 단일 진실의 원천.
  // searchParamString 의 다른 부분이 바뀌어도 bbox 만으로 재마운트하지 않음.
  const initialBboxRef = useRef<Bounds | null | undefined>(undefined);
  if (initialBboxRef.current === undefined) {
    initialBboxRef.current = paramToBbox(searchParams.get('bbox'));
  }
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

  // viewport 재검색에 실제로 적용 중인 bbox. 임계값 초과 시에만 갱신 → fetch 재트리거.
  const [appliedBounds, setAppliedBounds] = useState<Bounds | null>(initialBboxRef.current);
  // handleBoundsChange 의 setTimeout closure 가 stale 한 appliedBounds 를 참조하지 않도록
  // ref 로 미러링. 매 렌더 effect 에서 갱신.
  const appliedBoundsRef = useRef<Bounds | null>(initialBboxRef.current);
  useEffect(() => {
    appliedBoundsRef.current = appliedBounds;
  }, [appliedBounds]);
  // 직전 onBoundsChange 의 zoom level. Bounds 자체에는 level 이 없으므로 별도 ref 로 추적.
  // null = 아직 한 번도 idle 이벤트가 안 옴 → 첫 비교에서는 zoom 변경 미감지 (center 비교만으로 충분).
  const lastLevelRef = useRef<number | null>(null);
  // 지도 중심: appliedBounds (URL bbox) 의 중심 또는 EXPLORE_MAP_CENTER. 새 검색 결과가
  // 도착하면 마커 평균으로 한 번 이동. viewport 재검색 결과는 이동 안 함 (사용자가 정한 viewport 무효화 금지).
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(() => {
    const seed = initialBboxRef.current;
    if (seed) {
      return {
        lat: (seed.swLat + seed.neLat) / 2,
        lng: (seed.swLng + seed.neLng) / 2,
      };
    }
    return EXPLORE_MAP_CENTER;
  });
  // 새 query/필터 검색 시 true → 다음 vendor 결과 도착 시 마커 평균으로 mapCenter 이동 (1회).
  // viewport 재검색 시 false → 사용자 viewport 유지.
  const shouldRefitRef = useRef(true);
  // programmatic setCenter (예: fitBounds) 와 사용자 조작을 구분 — false 면 onBoundsChange 무시.
  const isUserDrivenRef = useRef(false);
  // viewport debounce timer. 새 idle 이벤트가 들어오면 기존 타이머 취소.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // vendor 카드 hover/click 으로 강조할 마커 식별자.
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  // 모바일에서 vendor 탭 안 sub-toggle ('list' | 'map'). 데스크톱에서는 무시.
  const [vendorMobileView, setVendorMobileView] = useState<'list' | 'map'>('list');

  const spaceFiltersRef = useRef<SpaceFilterState>(initialSpaceFilters);
  const [spaceFilterKey, setSpaceFilterKey] = useState(0);

  const handleFilterChange = useCallback((filters: SpaceFilterState) => {
    const prev = JSON.stringify(spaceFiltersRef.current);
    const next = JSON.stringify(filters);
    if (prev === next) return;
    spaceFiltersRef.current = filters;
    setSpaceFilterKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const prev = JSON.stringify(spaceFiltersRef.current);
    if (prev === initialSpaceFilterKey) return;
    spaceFiltersRef.current = initialSpaceFilters;
    setSpaceFilterKey((k) => k + 1);
  }, [initialSpaceFilterKey, initialSpaceFilters]);

  // URL 의 bbox 가 바뀌면 (예: 사용자가 헤더에서 새 query 검색 → buildSearchPath 가 bbox 미포함 URL push)
  // appliedBounds 도 동기화해야 stale 한 옛 viewport 로 fetch 하지 않는다.
  // initialBboxRef 의 lazy init 만으로는 mount 이후의 URL 변동을 잡지 못함.
  useEffect(() => {
    const next = paramToBbox(new URLSearchParams(searchParamString).get('bbox'));
    // 같은 bbox 면 setState skip → fetch effect 의 불필요한 재실행 방지 (P2 회귀 가드).
    setAppliedBounds((prev) => (boundsEqual(prev, next) ? prev : next));
    // URL 에 bbox 가 명시되어 있으면 (back/forward, 딥링크 등) 사용자/외부가 정한 viewport
    // 이므로 marker centroid 로 재이동하면 안 됨 — 사용자 viewport 보존.
    // bbox 가 없는 새 검색일 때만 refit 허용.
    shouldRefitRef.current = next == null;
  }, [searchParamString]);

  useEffect(() => {
    setHeaderSearchQuery(query);
  }, [query]);

  useEffect(() => {
    setSortBy(SEARCH_SORT_DEFAULT[activeTab]);
    setSortOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (isMockMode()) return;
    // URL/필터/탭/bbox 변경으로 effect 가 재실행되면 직전 fetch 결과는 무효화한다.
    // 특히 URL → setAppliedBounds 가 별도 effect 에서 일어나는 경우, 같은 렌더의 옛 fetch 와
    // 다음 렌더의 새 fetch 가 동시에 진행되어 응답 순서가 뒤바뀌면 stale 결과가 마지막에 적용될 수 있음.
    let cancelled = false;

    if (activeTab === 'space') {
      setRoomsLoading(true);
      const sf = spaceFiltersRef.current;
      const cleanKeywords = sf.keywords?.map((k) => k.replace(/^#/, '')).filter(Boolean) ?? [];
      searchRooms({
        q: query || undefined,
        category: sf.category,
        region: sf.regions?.length ? sf.regions[0] : undefined,
        regions: sf.regions,
        keywords: cleanKeywords.length ? cleanKeywords : undefined,
        capacity: sf.capacity,
        parking: sf.parking,
        dayOfWeek: sf.date ? getDayOfWeekParam(sf.date) : undefined,
        startHour: sf.date?.startHour,
        endHour: sf.date?.endHour,
        sort: sortBy,
        size: 20,
      })
        .then((res) => {
          if (cancelled) return;
          setRooms(res.rooms);
          setRoomsTotalCount(res.totalElements);
        })
        .finally(() => {
          if (cancelled) return;
          setRoomsLoading(false);
        });
    }

    if (activeTab === 'vendor') {
      setVendorsLoading(true);
      const sf = spaceFiltersRef.current;
      const cleanKeywords = sf.keywords?.map((k) => k.replace(/^#/, '')).filter(Boolean) ?? [];
      // PR-A2 머지로 capacity/parking/category vendor 검색 활성화. minPrice/maxPrice 는
      // SpaceFilterState 에 없어 미사용 — 가격 필터 UI 신설 시 별도 follow-up.
      // sort 는 vendor 전용 union 만 보냄 — space 의 'LATEST' 등은 차단.
      const vendorSort = (VENDOR_SORT_OPTIONS as readonly string[]).includes(sortBy)
        ? (sortBy as 'relevance' | 'popular' | 'latest')
        : undefined;
      searchVendors({
        q: query || undefined,
        sort: vendorSort,
        size: 20,
        regions: sf.regions?.length ? sf.regions : undefined,
        keywords: cleanKeywords.length ? cleanKeywords : undefined,
        bbox: appliedBounds ?? undefined,
        capacity: sf.capacity,
        // parking 은 truthy-only: false/undefined 모두 미전송 (PR-D 정책).
        parking: sf.parking === true ? true : undefined,
        category: sf.category,
      })
        .then((res) => {
          if (cancelled) return;
          setVendors(res.items);
          setVendorsTotalCount(res.totalCount ?? null);
          // 새 query/필터 검색 (= shouldRefitRef.current === true) 이고 좌표 보유 vendor 가 1개 이상이면
          // 마커 평균으로 mapCenter 이동 — viewport 밖에 결과가 모인 경우 "결과 없음" 오해 방지.
          // 정확한 fitBounds 는 KakaoMapView 의 setBounds API 가 필요 (본 PR 범위 외) → center 이동만으로 80% 해결.
          if (shouldRefitRef.current) {
            const located = res.items.filter(
              (v) => typeof v.latitude === 'number' && typeof v.longitude === 'number',
            );
            if (located.length > 0) {
              const sumLat = located.reduce((acc, v) => acc + (v.latitude as number), 0);
              const sumLng = located.reduce((acc, v) => acc + (v.longitude as number), 0);
              setMapCenter({ lat: sumLat / located.length, lng: sumLng / located.length });
            }
            shouldRefitRef.current = false;
          }
        })
        .finally(() => {
          if (cancelled) return;
          setVendorsLoading(false);
        });
    }

    if (activeTab === 'community') {
      setPostsLoading(true);
      searchPosts({ q: query || undefined, size: 20 })
        .then((res) => {
          if (cancelled) return;
          setPosts(res.items);
          setPostsTotalCount(res.totalCount ?? null);
        })
        .finally(() => {
          if (cancelled) return;
          setPostsLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab, sortBy, spaceFilterKey, appliedBounds]);

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

  // URL 의 ?bbox 만 갱신 (다른 필터 키는 그대로 보존). replaceState 라 history 가 부풀지 않음.
  const writeBboxToUrl = useCallback((bounds: Bounds | null) => {
    if (typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search);
    if (bounds) {
      next.set('bbox', bboxToParam(bounds));
    } else {
      next.delete('bbox');
    }
    const qs = next.toString();
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(window.history.state, '', nextUrl);
  }, []);

  // 사용자가 직접 drag/zoom 시작 — 다음 idle 부터의 bounds 변경을 진짜로 취급.
  const handleUserInteractionStart = useCallback(() => {
    isUserDrivenRef.current = true;
  }, []);

  // KakaoMap 의 idle 콜백. 매 idle 마다 lastBoundsRef 는 최신화하지만,
  // 임계값 통과 + 사용자 조작 직후일 때만 setAppliedBounds (= 재검색 트리거).
  // debounce 로 zoom/drag 연속 구간을 1번으로 합친다.
  // appliedBounds 는 ref 로 읽어 setTimeout closure 의 stale 값을 회피 + callback identity 안정화 →
  // KakaoMapView 의 viewport effect 가 listener 를 재등록하지 않음.
  const handleBoundsChange = useCallback(
    (payload: KakaoMapBoundsPayload) => {
      const next: BoundsWithCenter = payload;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (!isUserDrivenRef.current) {
          // programmatic move (fitBounds, 초기 마운트) — 재검색 차단.
          return;
        }
        const current = appliedBoundsRef.current;
        // zoom level 비교는 별도 ref 로 추적한 직전 level 과 비교한다.
        // (Bounds 에는 level 필드가 없고, prev 객체에 next.level 을 spread 하면 비교가 dead 된다)
        const prevLevel = lastLevelRef.current;
        const levelChanged = prevLevel !== null && prevLevel !== next.level;
        const prev = current
          ? ({
              ...current,
              centerLat: (current.swLat + current.neLat) / 2,
              centerLng: (current.swLng + current.neLng) / 2,
              level: prevLevel ?? next.level,
            } as BoundsWithCenter)
          : null;
        const threshold = pickRefetchThreshold();
        const diag = boundsDiagonal(next);
        const movedEnough =
          !prev ||
          levelChanged ||
          boundsCenterDistance(prev, next) >= diag * threshold;
        // 다음 비교를 위해 level snapshot 갱신은 movedEnough 결과와 무관하게 항상 수행.
        lastLevelRef.current = next.level;
        if (!movedEnough) {
          // 임계값 미만 조작도 사용자 의도이므로 gate 를 reset.
          // false 로 두면 다음 programmatic move (예: 새 검색 결과의 setMapCenter) 가
          // user-driven 으로 오인되어 의도치 않은 bbox URL 갱신 + 추가 fetch 발생.
          isUserDrivenRef.current = false;
          return;
        }

        const applied: Bounds = {
          swLat: next.swLat,
          swLng: next.swLng,
          neLat: next.neLat,
          neLng: next.neLng,
        };
        // viewport 재검색 — 사용자가 방금 정한 viewport 무효화하면 안 되므로 setMapCenter 차단.
        shouldRefitRef.current = false;
        setAppliedBounds(applied);
        writeBboxToUrl(applied);
        // 사용자 조작 cycle 종료 — 다음 사용자 입력 전까지는 다시 programmatic 으로 간주.
        isUserDrivenRef.current = false;
      }, VIEWPORT_DEBOUNCE_MS);
    },
    [writeBboxToUrl],
  );

  // unmount / 탭 전환 시 진행 중인 debounce 타이머 정리.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  // 마커: 좌표 보유 vendor 만. label="공간 N" (N>0). active 시 pinStyle 강조.
  const vendorMarkers = useMemo(() => {
    return vendors
      .filter((v) => typeof v.latitude === 'number' && typeof v.longitude === 'number')
      .map((v) => ({
        lat: v.latitude as number,
        lng: v.longitude as number,
        title: v.name,
        label: v.roomCount && v.roomCount > 0 ? `공간 ${v.roomCount}` : undefined,
        pinStyle: (activeVendorId === v.id ? 'active' : 'default') as 'active' | 'default',
      }));
  }, [vendors, activeVendorId]);

  const { suggestions: filteredSuggestions } = useSearchSuggestions(headerSearchQuery);

  const handleSearchSubmit = (value: string) => {
    const normalizedValue = value.trim();

    navigate(buildSearchPath(normalizedValue, spaceFiltersRef.current));
  };

  const searchTitle = query
    ? `'${query}' 검색 결과`
    : hasSpaceSearchFilters(spaceFiltersRef.current)
      ? '조건 검색 결과'
      : '전체 검색 결과';

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
        <h1 className="search-results__title">{searchTitle}</h1>

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
            <HomeSpaceExplorer
              initialFilters={initialSpaceFilters}
              key={initialSpaceFilterKey}
              onFilterChange={handleFilterChange}
              resultLimit={20}
              variant="section"
            />
          ) : (
            <HomeSpaceExplorer
              initialFilters={initialSpaceFilters}
              key={initialSpaceFilterKey}
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
            // mock 모드: 지도 SDK 비활성 가능성 — 기존 카드 그리드만 유지.
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
            <div
              className={`search-results__vendor-split search-results__vendor-split--${vendorMobileView}`}
              data-testid="vendor-split"
            >
              {/* 모바일에서만 보이는 list/map 토글. 데스크톱에서는 CSS 로 숨김. */}
              <div className="search-results__vendor-mobile-toggle" role="tablist">
                <button
                  aria-selected={vendorMobileView === 'list'}
                  className={`search-results__vendor-mobile-tab ${vendorMobileView === 'list' ? 'search-results__vendor-mobile-tab--active' : ''}`}
                  onClick={() => setVendorMobileView('list')}
                  role="tab"
                  type="button"
                >
                  목록
                </button>
                <button
                  aria-selected={vendorMobileView === 'map'}
                  className={`search-results__vendor-mobile-tab ${vendorMobileView === 'map' ? 'search-results__vendor-mobile-tab--active' : ''}`}
                  onClick={() => setVendorMobileView('map')}
                  role="tab"
                  type="button"
                >
                  지도
                </button>
              </div>

              <div className="search-results__vendor-list-pane">
                {vendors.length === 0 ? (
                  <div className="search-results__empty">조건에 맞는 업체가 없어요.</div>
                ) : (
                  <div className="search-results__vendor-list">
                    {vendors.map((vendor) => {
                      const hasCoord =
                        typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number';
                      const isActive = activeVendorId === vendor.id;
                      return (
                        <Link
                          className={`search-results__vendor-row search-results__vendor-card--link${isActive ? ' search-results__vendor-row--active' : ''}`}
                          data-vendor-id={vendor.id}
                          key={vendor.id}
                          onClick={() => setActiveVendorId(vendor.id)}
                          onMouseEnter={hasCoord ? () => setActiveVendorId(vendor.id) : undefined}
                          onMouseLeave={hasCoord ? () => setActiveVendorId((prev) => (prev === vendor.id ? null : prev))
                            : undefined}
                          to={`/vendors/${vendor.slug || vendor.id}`}
                        >
                          <div
                            className="search-results__vendor-avatar"
                            style={vendor.thumbnailUrl ? { backgroundImage: `url(${vendor.thumbnailUrl})`, backgroundSize: 'cover' } : undefined}
                          />
                          <div className="search-results__vendor-body">
                            <h2 className="search-results__vendor-name">{vendor.name}</h2>
                            <p className="search-results__vendor-meta">
                              {vendor.address}
                              {typeof vendor.roomCount === 'number' && vendor.roomCount > 0 ? (
                                <>
                                  {' · '}
                                  <span className="search-results__vendor-rooms">공간 {vendor.roomCount}개</span>
                                </>
                              ) : null}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="search-results__vendor-map-pane">
                <KakaoMapView
                  center={mapCenter}
                  className="search-results__vendor-map"
                  level={5}
                  markers={vendorMarkers}
                  onBoundsChange={handleBoundsChange}
                  onUserInteractionStart={handleUserInteractionStart}
                  title="업체 검색 결과 지도"
                />
              </div>
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
