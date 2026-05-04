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
 */
jest.mock('../../components/map/KakaoMapView', () => ({
  KakaoMapView: ({
    markers = [],
    onBoundsChange,
    onUserInteractionStart,
    title,
  }: {
    markers?: unknown[];
    onBoundsChange?: (p: unknown) => void;
    onUserInteractionStart?: () => void;
    title?: string;
  }) => (
    <div
      aria-label={title}
      data-marker-count={markers.length}
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
  ),
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
