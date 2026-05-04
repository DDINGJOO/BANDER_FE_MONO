import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { searchVendors, searchRooms, searchPosts } from '../../api/search';
import { SearchResultsPage } from '../SearchResultsPage';

// ── 모듈 모킹 ──────────────────────────────────────────────────────────────

jest.mock('../../api/search', () => ({
  searchVendors: jest.fn(),
  searchRooms: jest.fn(),
  searchPosts: jest.fn(),
}));

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeFooter', () => ({
  HomeFooter: () => <div data-testid="home-footer" />,
}));

jest.mock('../../components/home/HomeSpaceExplorer', () => ({
  HomeSpaceExplorer: () => <div data-testid="space-explorer" />,
}));

/**
 * KakaoMapView stub.
 * onClick → onUserInteractionStart + onBoundsChange (large move, 대각선 20% 초과).
 * 추가로 captureMapHandlers() 가 마지막 마운트의 onBoundsChange / onUserInteractionStart 를
 * 가져와 임의 payload 로 호출할 수 있게 한다 (zoom-only 변경 등 시나리오용).
 */
let __lastOnBoundsChange: ((p: unknown) => void) | undefined;
let __lastOnUserInteractionStart: (() => void) | undefined;
function captureMapHandlers() {
  return {
    onBoundsChange: __lastOnBoundsChange,
    onUserInteractionStart: __lastOnUserInteractionStart,
  };
}
jest.mock('../../components/map/KakaoMapView', () => ({
  KakaoMapView: ({
    markers = [],
    onBoundsChange,
    onUserInteractionStart,
    title,
    center,
  }: {
    markers?: unknown[];
    onBoundsChange?: (p: unknown) => void;
    onUserInteractionStart?: () => void;
    title?: string;
    center?: { lat: number; lng: number };
  }) => {
    __lastOnBoundsChange = onBoundsChange;
    __lastOnUserInteractionStart = onUserInteractionStart;
    return (
      <div
        aria-label={title}
        data-marker-count={markers.length}
        data-center-lat={center ? String(center.lat) : ''}
        data-center-lng={center ? String(center.lng) : ''}
        data-testid="vendor-map"
        onClick={() => {
          onUserInteractionStart?.();
          onBoundsChange?.({
            swLat: 37.4,
            swLng: 126.8,
            neLat: 37.6,
            neLng: 127.0,
            centerLat: 37.5,
            centerLng: 126.9,
            level: 5,
          });
        }}
        role="img"
      />
    );
  },
}));

jest.mock('../../components/shared/Icons', () => ({
  ChevronIcon: () => <span data-testid="chevron" />,
}));

jest.mock('../../data/authSession', () => ({
  loadAuthSession: () => null,
}));

jest.mock('../../config/publicEnv', () => ({
  isMockMode: () => false,
}));

jest.mock('../../hooks/useSearchSuggestions', () => ({
  useSearchSuggestions: () => ({ suggestions: [] }),
}));

// ── 타입 헬퍼 ──────────────────────────────────────────────────────────────

const mockedSearchVendors = searchVendors as jest.MockedFunction<typeof searchVendors>;
const mockedSearchRooms = searchRooms as jest.MockedFunction<typeof searchRooms>;
const mockedSearchPosts = searchPosts as jest.MockedFunction<typeof searchPosts>;

const EMPTY_ROOMS = { rooms: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
const EMPTY_POSTS = { items: [], nextCursor: null, hasNext: false, totalCount: 0, size: 20 };

function vendorItem(overrides: Partial<{
  id: string; name: string; slug: string; description: string;
  address: string; thumbnailUrl: string; roomCount: number;
  latitude: number | undefined; longitude: number | undefined;
}> = {}) {
  return {
    id: 'v1',
    name: '유스뮤직',
    slug: 'youth-music',
    description: '합주실',
    address: '서울 마포구',
    thumbnailUrl: '',
    roomCount: 3,
    latitude: 37.55 as number | undefined,
    longitude: 126.92 as number | undefined,
    ...overrides,
  };
}

function vendorPage(items = [vendorItem()]) {
  return { items, nextCursor: null, hasNext: false, totalCount: items.length, size: 20 };
}

// ── setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockedSearchRooms.mockResolvedValue(EMPTY_ROOMS);
  mockedSearchPosts.mockResolvedValue(EMPTY_POSTS);
  // 모든 searchVendors 호출에 기본 응답. 개별 테스트에서 mockReturnValue 로 덮어씀.
  mockedSearchVendors.mockResolvedValue(vendorPage());
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * 업체 탭으로 전환하고 로딩이 끝날 때까지 대기.
 * 탭 전환 전에 mockedSearchVendors.mockReturnValue 를 설정해두면 그 응답이 사용됨.
 */
async function switchToVendorTab() {
  await act(async () => {
    fireEvent.click(screen.getByText('업체'));
  });
  await waitFor(
    () => expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument(),
    { timeout: 3000 },
  );
}

// ── 테스트 ─────────────────────────────────────────────────────────────────

describe('SearchResultsPage — 업체 탭', () => {
  it('업체 탭으로 전환하면 searchVendors 가 q, size 와 함께 호출된다', async () => {
    render(
      <MemoryRouter initialEntries={['/search?q=드럼']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    expect(mockedSearchVendors).toHaveBeenCalledWith(
      expect.objectContaining({ q: '드럼', size: 20 }),
    );
  });

  it('분할 레이아웃: 카드 패널과 지도 패널이 모두 렌더된다', async () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    expect(screen.getByTestId('vendor-split')).toBeInTheDocument();
    expect(screen.getByTestId('vendor-map')).toBeInTheDocument();
    expect(screen.getByText('유스뮤직')).toBeInTheDocument();
  });

  it('좌표 있는 vendor 만 마커로, 좌표 없는 vendor 도 카드엔 나온다', async () => {
    // 탭 전환 호출에 대한 응답을 지정
    mockedSearchVendors.mockResolvedValue(
      vendorPage([
        vendorItem({ id: 'v1', latitude: 37.55, longitude: 126.92 }),
        vendorItem({ id: 'v2', name: '좌표없음', slug: 'noloc',
          latitude: undefined, longitude: undefined }),
      ]),
    );

    render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    expect(screen.getByText('좌표없음')).toBeInTheDocument();
    expect(screen.getByTestId('vendor-map')).toHaveAttribute('data-marker-count', '1');
  });

  it('vendor 없으면 빈 상태 메시지를 표시한다', async () => {
    mockedSearchVendors.mockResolvedValue(vendorPage([]));

    render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    expect(screen.getByText('조건에 맞는 업체가 없어요.')).toBeInTheDocument();
  });

  it('URL ?bbox 파라미터가 있으면 searchVendors 에 bbox 객체를 전달한다', async () => {
    render(
      <MemoryRouter initialEntries={['/search?bbox=37.5%2C126.9%2C37.6%2C127.0']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    // bbox 를 담은 호출이 하나 이상 있어야 함
    const bboxCall = mockedSearchVendors.mock.calls.find(
      ([p]) => p.bbox !== undefined,
    );
    expect(bboxCall).toBeDefined();
    expect(bboxCall![0].bbox).toEqual({
      swLat: 37.5, swLng: 126.9, neLat: 37.6, neLng: 127.0,
    });
  });

  it('PR-A2: URL 의 capacity/parking/category 가 searchVendors 에 전달된다', async () => {
    render(
      <MemoryRouter
        initialEntries={['/search?q=드럼&capacity=4&parking=true&category=PRACTICE_ROOM']}
      >
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    expect(mockedSearchVendors).toHaveBeenCalledWith(
      expect.objectContaining({
        capacity: 4,
        parking: true,
        category: 'PRACTICE_ROOM',
      }),
    );
  });

  it('PR-A2: parking 미지정이면 searchVendors 에 parking 키가 undefined 로만 전달된다', async () => {
    render(
      <MemoryRouter initialEntries={['/search?q=드럼']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    // 모든 호출이 parking === undefined (truthy-only 정책: false 도 보내지 않음)
    expect(mockedSearchVendors).toHaveBeenCalled();
    for (const [params] of mockedSearchVendors.mock.calls) {
      expect(params.parking).toBeUndefined();
      expect(params.capacity).toBeUndefined();
      expect(params.category).toBeUndefined();
    }
  });

  it('지도 사용자 조작 후 debounce 350ms 경과 → viewport 재검색 트리거', async () => {
    jest.useFakeTimers('modern');
    try {
      render(
        <MemoryRouter initialEntries={['/search']}>
          <SearchResultsPage />
        </MemoryRouter>,
      );

      // 업체 탭 전환 (Promise microtask 포함)
      await act(async () => {
        fireEvent.click(screen.getByText('업체'));
        await Promise.resolve();
      });

      const countAfterInit = mockedSearchVendors.mock.calls.length;

      // 지도 클릭 → onUserInteractionStart + onBoundsChange
      act(() => { fireEvent.click(screen.getByTestId('vendor-map')); });

      // 200ms — 아직 debounce 진행 중
      act(() => { jest.advanceTimersByTime(200); });
      expect(mockedSearchVendors.mock.calls.length).toBe(countAfterInit);

      // 추가 200ms (총 400ms > 350ms) → debounce 완료 → 재검색
      await act(async () => {
        jest.advanceTimersByTime(200);
        await Promise.resolve();
      });
      expect(mockedSearchVendors.mock.calls.length).toBeGreaterThan(countAfterInit);
    } finally {
      jest.useRealTimers();
    }
  });

  it('zoom level 만 변경되어도 (center 동일) viewport 재검색이 트리거된다 — F1 회귀 방지', async () => {
    jest.useFakeTimers('modern');
    try {
      render(
        <MemoryRouter initialEntries={['/search']}>
          <SearchResultsPage />
        </MemoryRouter>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('업체'));
        await Promise.resolve();
      });

      const baseline = mockedSearchVendors.mock.calls.length;
      const { onBoundsChange, onUserInteractionStart } = captureMapHandlers();
      expect(onBoundsChange).toBeDefined();

      // 1차 idle: level 5 — 직전 level 이 null 이므로 levelChanged 는 false 지만
      //         최초 사용자 조작 + center 미설정이므로 어차피 trigger 됨. lastLevelRef 에 5 가 박힘.
      act(() => {
        onUserInteractionStart?.();
        onBoundsChange?.({
          swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0,
          centerLat: 37.5, centerLng: 126.9, level: 5,
        });
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
        await Promise.resolve();
      });
      const afterFirstZoom = mockedSearchVendors.mock.calls.length;
      expect(afterFirstZoom).toBeGreaterThan(baseline);

      // 2차 idle: 동일 bbox/center, level 만 6 으로 변경 → center 거리 0 이지만 levelChanged 로 trigger.
      act(() => {
        onUserInteractionStart?.();
        onBoundsChange?.({
          swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0,
          centerLat: 37.5, centerLng: 126.9, level: 6,
        });
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
        await Promise.resolve();
      });
      expect(mockedSearchVendors.mock.calls.length).toBeGreaterThan(afterFirstZoom);
    } finally {
      jest.useRealTimers();
    }
  });

  it('center 가 임계값 미만으로만 움직이고 zoom 동일하면 재검색하지 않는다', async () => {
    jest.useFakeTimers('modern');
    try {
      render(
        <MemoryRouter initialEntries={['/search']}>
          <SearchResultsPage />
        </MemoryRouter>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('업체'));
        await Promise.resolve();
      });

      const { onBoundsChange, onUserInteractionStart } = captureMapHandlers();

      // 1차: appliedBounds 시드 + level 5 등록.
      act(() => {
        onUserInteractionStart?.();
        onBoundsChange?.({
          swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0,
          centerLat: 37.5, centerLng: 126.9, level: 5,
        });
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
        await Promise.resolve();
      });
      const beforeMicroMove = mockedSearchVendors.mock.calls.length;

      // 2차: 같은 level, center 가 대각선의 1% 만 이동 (임계값 20% 미달) → trigger 금지.
      // 대각선 ≈ sqrt(0.2^2+0.2^2) ≈ 0.283. 임계값 20% ≈ 0.057. 0.001 이동은 한참 미달.
      act(() => {
        onUserInteractionStart?.();
        onBoundsChange?.({
          swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0,
          centerLat: 37.501, centerLng: 126.901, level: 5,
        });
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
        await Promise.resolve();
      });
      expect(mockedSearchVendors.mock.calls.length).toBe(beforeMicroMove);
    } finally {
      jest.useRealTimers();
    }
  });

  it('임계값 미만 사용자 조작 후 다음 programmatic move 가 사용자 조작으로 오인되지 않는다 — gate reset 회귀 방지', async () => {
    jest.useFakeTimers('modern');
    try {
      render(
        <MemoryRouter initialEntries={['/search']}>
          <SearchResultsPage />
        </MemoryRouter>,
      );

      await act(async () => {
        fireEvent.click(screen.getByText('업체'));
        await Promise.resolve();
      });

      const { onBoundsChange, onUserInteractionStart } = captureMapHandlers();

      // 1차: appliedBounds 시드 (재검색 trigger). lastLevelRef = 5, isUserDriven = false (cycle 종료).
      act(() => {
        onUserInteractionStart?.();
        onBoundsChange?.({
          swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0,
          centerLat: 37.5, centerLng: 126.9, level: 5,
        });
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
        await Promise.resolve();
      });
      const afterSeed = mockedSearchVendors.mock.calls.length;

      // 2차: 사용자가 임계값 미만 미세 조작. isUserDriven=true 로 진입했지만
      // movedEnough=false 이므로 fetch 차단. 수정 전: gate 가 true 로 남음.
      // 수정 후: gate 가 false 로 reset 되어야 함.
      act(() => {
        onUserInteractionStart?.();
        onBoundsChange?.({
          swLat: 37.4, swLng: 126.8, neLat: 37.6, neLng: 127.0,
          centerLat: 37.501, centerLng: 126.901, level: 5,
        });
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
        await Promise.resolve();
      });
      expect(mockedSearchVendors.mock.calls.length).toBe(afterSeed);

      // 3차: programmatic move 시뮬레이션 — onUserInteractionStart 없이 큰 폭 이동.
      // 수정 전: 직전 cycle 의 gate=true 잔존 → 임계값 초과 시 재검색 trigger (버그).
      // 수정 후: gate=false → programmatic 으로 인식 → 재검색 차단.
      act(() => {
        onBoundsChange?.({
          swLat: 38.0, swLng: 127.5, neLat: 38.2, neLng: 127.7,
          centerLat: 38.1, centerLng: 127.6, level: 5,
        });
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
        await Promise.resolve();
      });
      expect(mockedSearchVendors.mock.calls.length).toBe(afterSeed);
    } finally {
      jest.useRealTimers();
    }
  });

  it('URL ?bbox 가 빠르게 두 번 바뀌어도 마지막 응답만 vendors 에 적용된다 — F2 race 방지', async () => {
    // 첫 fetch (bbox=A) 응답을 사람이 풀어줄 때까지 보류.
    let resolveFirst: (v: ReturnType<typeof vendorPage>) => void = () => {};
    const firstPending = new Promise<ReturnType<typeof vendorPage>>((resolve) => {
      resolveFirst = resolve;
    });
    const firstItems = vendorPage([vendorItem({ id: 'old', name: '옛결과' })]);
    const secondItems = vendorPage([vendorItem({ id: 'new', name: '새결과' })]);

    mockedSearchVendors.mockImplementationOnce(() => firstPending);
    mockedSearchVendors.mockImplementationOnce(() => Promise.resolve(secondItems));

    const { rerender } = render(
      <MemoryRouter initialEntries={['/search?bbox=37.5%2C126.9%2C37.6%2C127.0']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText('업체'));
      await Promise.resolve();
    });

    // 두 번째 URL (bbox=B) 로 rerender → 첫 effect cleanup → cancelled = true.
    rerender(
      <MemoryRouter initialEntries={['/search?bbox=37.55%2C126.95%2C37.65%2C127.05']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    // 두 번째 fetch (즉시 resolve) 가 먼저 완료.
    await waitFor(() => expect(screen.getByText('새결과')).toBeInTheDocument(), { timeout: 3000 });

    // 이제 첫 fetch 의 stale 응답이 resolve 되어도 setVendors 호출 차단되어야.
    await act(async () => {
      resolveFirst(firstItems);
      await Promise.resolve();
    });

    // '옛결과' 가 화면에 절대 나타나면 안 됨.
    expect(screen.queryByText('옛결과')).not.toBeInTheDocument();
    expect(screen.getByText('새결과')).toBeInTheDocument();
  });

  it('URL ?bbox 가 있으면 vendor 결과 도착 후에도 mapCenter 가 marker centroid 로 이동하지 않는다 — F1 #2 사용자 viewport 보존', async () => {
    // bbox 가 명시된 viewport: center ≈ (37.55, 126.95). vendor 위치는 (37.55, 126.92).
    // refit 이 일어나면 mapCenter 가 vendor 평균 (126.92) 으로 변하지만, URL bbox 가 있으면
    // shouldRefitRef = false 이어야 하므로 mapCenter 는 초기값을 유지해야 한다.
    mockedSearchVendors.mockResolvedValue(
      vendorPage([vendorItem({ id: 'v1', latitude: 37.55, longitude: 126.92 })]),
    );

    render(
      <MemoryRouter initialEntries={['/search?bbox=37.5%2C126.9%2C37.6%2C127.0']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    const map = screen.getByTestId('vendor-map');
    // URL bbox 의 center = ((37.5+37.6)/2, (126.9+127.0)/2) = (37.55, 126.95).
    // marker 평균 lng = 126.92 와 다르므로 보존되었는지 확실히 구분 가능.
    expect(map.getAttribute('data-center-lng')).toBe('126.95');
    expect(map.getAttribute('data-center-lat')).toBe('37.55');
  });

  it('같은 URL 로 rerender 해도 vendor fetch 가 추가로 트리거되지 않는다 — F1 #3 P2 회귀 가드', async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/search?bbox=37.5%2C126.9%2C37.6%2C127.0']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();
    const baseline = mockedSearchVendors.mock.calls.length;

    // 동일 URL 로 rerender — searchParamString 이 같은 값으로 재계산되더라도 effect dep 가 동일.
    // 단, URL sync effect 가 무조건 setAppliedBounds(next) 하면 새 객체 reference 로 인해
    // fetch effect 가 재실행됨. boundsEqual 가드로 차단되어야 함.
    rerender(
      <MemoryRouter initialEntries={['/search?bbox=37.5%2C126.9%2C37.6%2C127.0']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockedSearchVendors.mock.calls.length).toBe(baseline);
    }, { timeout: 500 });
  });

  it('모바일 토글: "지도" 탭 클릭 시 --map 클래스 적용', async () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <SearchResultsPage />
      </MemoryRouter>,
    );
    await switchToVendorTab();

    const split = screen.getByTestId('vendor-split');
    expect(split.className).toContain('--list');

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: '지도' }));
    });
    expect(split.className).toContain('--map');
  });
});
