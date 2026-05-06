import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  getExploreMapMarkers,
  getExploreMapPopularVendors,
  getExploreMapSpaces,
} from '../../api/exploreMap';
import { fetchVendorDetail } from '../../api/spaces';
import { ExploreMapPage } from '../ExploreMapPage';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: ({
    onSearchChange,
    onSearchSubmit,
    searchQuery,
  }: {
    onSearchChange: (value: string) => void;
    onSearchSubmit: (value: string) => void;
    searchQuery: string;
  }) => (
    <div data-testid="home-header">
      <input
        aria-label="지도 검색"
        onChange={(event) => onSearchChange(event.target.value)}
        value={searchQuery}
      />
      <button onClick={() => onSearchSubmit(searchQuery)} type="button">
        검색
      </button>
    </div>
  ),
}));

jest.mock('../../components/home/HomeSpaceExplorer', () => ({
  HomeSpaceExplorer: () => <div data-testid="space-filter" />,
}));

jest.mock('../../components/map/KakaoMapView', () => ({
  KakaoMapView: ({
    center,
    layoutKey,
    markers = [],
    onMarkerClick,
  }: {
    center: { lat: number; lng: number };
    layoutKey?: string | number;
    markers?: Array<{ detailPath?: string; lat: number; lng: number; title?: string }>;
    onMarkerClick?: (marker: { detailPath?: string; lat: number; lng: number; title?: string }) => void;
  }) => (
    <div
      data-center={`${center.lat},${center.lng}`}
      data-layout-key={layoutKey}
      data-marker-count={markers.length}
      data-testid="explore-map"
    >
      {markers.map((marker, index) => (
        <button
          aria-label={`마커 ${marker.title ?? index}`}
          key={`${marker.title ?? 'marker'}-${index}`}
          onClick={() => onMarkerClick?.(marker)}
          type="button"
        />
      ))}
    </div>
  ),
}));

jest.mock('../../components/shared/Icons', () => ({
  StarIcon: () => <span data-testid="star-icon" />,
}));

jest.mock('../../api/exploreMap', () => ({
  getExploreMapMarkers: jest.fn(),
  getExploreMapPopularVendors: jest.fn(),
  getExploreMapSpaces: jest.fn(),
}));

jest.mock('../../api/spaces', () => ({
  fetchVendorDetail: jest.fn(),
}));

const mockedGetExploreMapMarkers = getExploreMapMarkers as jest.MockedFunction<typeof getExploreMapMarkers>;
const mockedGetExploreMapPopularVendors = getExploreMapPopularVendors as jest.MockedFunction<
  typeof getExploreMapPopularVendors
>;
const mockedGetExploreMapSpaces = getExploreMapSpaces as jest.MockedFunction<typeof getExploreMapSpaces>;
const mockedFetchVendorDetail = fetchVendorDetail as jest.MockedFunction<typeof fetchVendorDetail>;

function vendorDetail(overrides: Partial<Awaited<ReturnType<typeof fetchVendorDetail>>> = {}) {
  return {
    address: {
      detailAddress: '지하 1층',
      latitude: 37.4453311,
      longitude: 126.6961342,
      roadAddress: '인천 남동구 문화서로4번길 19-1',
    },
    basicInfoRows: [],
    businessHours: [],
    contactPhone: '010-0000-0000',
    description: '바인드 합주실 상세 설명',
    hashTags: ['#합주실'],
    holidays: [],
    homepageUrls: [],
    keywords: [],
    name: '바인드 합주실',
    ownerUserId: 'owner-1',
    parkingPolicy: null,
    primaryImageRef: null,
    primaryImageUrl: 'https://cdn.example.com/bind-main.png',
    rooms: [
      {
        categoryLabel: '합주실',
        imageUrl: 'https://cdn.example.com/a-room.png',
        location: '인천 남동구',
        priceLabel: '20,000원',
        priceSuffix: '/60분',
        rating: null,
        roomId: 'room-1',
        slug: 'bind-a-room',
        studioLabel: '바인드 합주실',
        tags: ['예약가능'],
        title: 'A룸',
      },
    ],
    slug: 'bind-studio',
    vendorId: 'vendor-1',
    ...overrides,
  };
}

beforeEach(() => {
  mockedGetExploreMapSpaces.mockReset();
  mockedGetExploreMapMarkers.mockReset();
  mockedGetExploreMapPopularVendors.mockReset();
  mockedFetchVendorDetail.mockReset();

  mockedGetExploreMapSpaces.mockResolvedValue({
    hasNext: false,
    items: [],
    page: 0,
    size: 20,
    totalCount: 0,
  });
  mockedGetExploreMapMarkers.mockResolvedValue({ markers: [] });
  mockedGetExploreMapPopularVendors.mockResolvedValue({ vendors: [] });
  mockedFetchVendorDetail.mockResolvedValue(vendorDetail());
});

test('renders the map without dummy cards when the backend has no map data', async () => {
  render(
    <MemoryRouter>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  await waitFor(() => expect(mockedGetExploreMapSpaces).toHaveBeenCalledTimes(1));

  expect(screen.getByTestId('explore-map')).toHaveAttribute('data-marker-count', '0');
  expect(screen.queryByRole('button', { name: /지도 안 업체/ })).not.toBeInTheDocument();
  expect(screen.queryByText('A룸 그랜드 피아노 대관')).not.toBeInTheDocument();
  expect(screen.queryByText('서울 마포구 인기 합주실')).not.toBeInTheDocument();
});

test('exposes a mobile map list toggle for backend vendors', async () => {
  mockedGetExploreMapSpaces.mockResolvedValue({
    hasNext: false,
    items: [
      {
        availableRoomCount: 2,
        bookmarkSaved: false,
        detailPath: '/vendors/upbeat-studio',
        imageUrl: 'https://cdn.example.com/upbeat.png',
        location: '서울 마포구 서교동',
        priceLabel: '10,000원~',
        priceSuffix: '/60분',
        rating: '',
        spaceType: '업체',
        studio: '2개 공간',
        tags: ['공간 2개', '예약가능'],
        title: '업비트스튜디오',
      },
      {
        availableRoomCount: 1,
        bookmarkSaved: true,
        detailPath: '/vendors/seoul-street-performance',
        imageUrl: '',
        location: '서울 마포구 동교동',
        priceLabel: '12,000원~',
        priceSuffix: '/60분',
        rating: '',
        spaceType: '업체',
        studio: '1개 공간',
        tags: ['공간 1개'],
        title: '서울스트리트퍼포먼스',
      },
    ],
    page: 0,
    size: 20,
    totalCount: 2,
  });
  mockedGetExploreMapMarkers.mockResolvedValue({
    markers: [
      {
        availableRoomCount: 1,
        id: 'marker-1',
        label: '업비트스튜디오',
        lat: 37.555,
        lng: 126.923,
        spaceOrVendorId: 'upbeat-studio',
      },
    ],
  });

  render(
    <MemoryRouter>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  const toggle = await screen.findByRole('button', { name: /지도 안 업체 2곳 목록 보기/ });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByTestId('explore-map')).toHaveAttribute('data-marker-count', '1');

  fireEvent.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: /지도 안 업체 2곳 접기/ })).toBeInTheDocument();
});

test('loads the next map list page when the sidebar scroll reaches the bottom', async () => {
  mockedGetExploreMapSpaces
    .mockResolvedValueOnce({
      hasNext: true,
      items: [
        {
          availableRoomCount: 2,
          bookmarkSaved: false,
          detailPath: '/vendors/first-studio',
          imageUrl: 'https://cdn.example.com/first.png',
          location: '서울 강남구',
          priceLabel: '10,000원~',
          priceSuffix: '/60분',
          rating: '',
          spaceType: '업체',
          studio: '2개 공간',
          tags: ['공간 2개'],
          title: '첫번째스튜디오',
        },
      ],
      page: 0,
      size: 20,
      totalCount: 2,
    })
    .mockResolvedValueOnce({
      hasNext: false,
      items: [
        {
          availableRoomCount: 1,
          bookmarkSaved: false,
          detailPath: '/vendors/second-studio',
          imageUrl: 'https://cdn.example.com/second.png',
          location: '서울 강남구',
          priceLabel: '12,000원~',
          priceSuffix: '/60분',
          rating: '',
          spaceType: '업체',
          studio: '1개 공간',
          tags: ['공간 1개'],
          title: '두번째스튜디오',
        },
      ],
      page: 1,
      size: 20,
      totalCount: 2,
    });

  render(
    <MemoryRouter>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  expect(await screen.findByText('첫번째스튜디오')).toBeInTheDocument();

  const list = screen.getByTestId('explore-map-list');
  Object.defineProperty(list, 'clientHeight', { configurable: true, value: 500 });
  Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(list, 'scrollTop', { configurable: true, value: 260 });

  fireEvent.scroll(list);

  await waitFor(() => {
    expect(mockedGetExploreMapSpaces).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, size: 20 }));
  });
  expect(await screen.findByText('두번째스튜디오')).toBeInTheDocument();
});

test('keeps URL-driven map searches on the map page and recenters to the first result marker', async () => {
  mockedGetExploreMapSpaces.mockResolvedValue({
    hasNext: false,
    items: [
      {
        availableRoomCount: 2,
        bookmarkSaved: false,
        detailPath: '/vendors/bind-studio',
        imageUrl: 'https://cdn.example.com/bind-studio.png',
        location: '인천 남동구',
        priceLabel: '20,000원~',
        priceSuffix: '/60분',
        rating: '',
        spaceType: '업체',
        studio: '2개 공간',
        tags: ['공간 2개'],
        title: '바인드 합주실',
      },
    ],
    page: 0,
    size: 20,
    totalCount: 1,
  });
  mockedGetExploreMapMarkers.mockResolvedValue({
    markers: [
      {
        availableRoomCount: 2,
        id: 'studio-bind',
        label: '바인드 합주실',
        lat: 37.4453311,
        lng: 126.6961342,
        spaceOrVendorId: 'bind-studio',
      },
    ],
  });

  render(
    <MemoryRouter initialEntries={['/search/map?q=바인드']}>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(mockedGetExploreMapSpaces).toHaveBeenLastCalledWith(expect.objectContaining({ q: '바인드' }));
  });
  await waitFor(() => {
    expect(screen.getByTestId('explore-map')).toHaveAttribute('data-center', '37.4453311,126.6961342');
  });
});

test('routes header search on the map page to integrated search', async () => {
  render(
    <MemoryRouter initialEntries={['/search/map']}>
      <Routes>
        <Route element={<ExploreMapPage />} path="/search/map" />
        <Route element={<div data-testid="integrated-search-page" />} path="/search" />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText('지도 검색'), { target: { value: '바인드' } });
  fireEvent.click(screen.getByRole('button', { name: '검색' }));

  expect(await screen.findByTestId('integrated-search-page')).toBeInTheDocument();
});

test('opens vendor detail beside the map from a list item without full-page navigation', async () => {
  mockedGetExploreMapSpaces.mockResolvedValue({
    hasNext: false,
    items: [
      {
        availableRoomCount: 2,
        bookmarkSaved: false,
        detailPath: '/vendors/bind-studio',
        imageUrl: 'https://cdn.example.com/bind-studio.png',
        location: '인천 남동구',
        priceLabel: '20,000원~',
        priceSuffix: '/60분',
        rating: '',
        spaceType: '업체',
        studio: '2개 공간',
        tags: ['공간 2개', '예약가능'],
        title: '바인드 합주실',
      },
    ],
    page: 0,
    size: 20,
    totalCount: 1,
  });
  mockedGetExploreMapMarkers.mockResolvedValue({
    markers: [
      {
        availableRoomCount: 2,
        id: 'studio-bind',
        label: '바인드 합주실',
        lat: 37.4453311,
        lng: 126.6961342,
        spaceOrVendorId: 'bind-studio',
      },
    ],
  });

  render(
    <MemoryRouter initialEntries={['/search/map']}>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  fireEvent.click(await screen.findByText('바인드 합주실'));

  await waitFor(() => expect(mockedFetchVendorDetail).toHaveBeenCalledWith('bind-studio'));
  expect(await screen.findByRole('heading', { name: '바인드 합주실' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '전체 상세' })).toHaveAttribute('href', '/vendors/bind-studio');
  expect(screen.getByText('A룸')).toBeInTheDocument();
  expect(screen.getByTestId('explore-map')).toHaveAttribute('data-center', '37.4453311,126.6961342');
  expect(screen.getByTestId('explore-map')).toHaveAttribute('data-layout-key', 'bind-studio');
});

test('opens the same vendor detail from a map marker click', async () => {
  mockedGetExploreMapSpaces.mockResolvedValue({
    hasNext: false,
    items: [
      {
        availableRoomCount: 2,
        bookmarkSaved: false,
        detailPath: '/vendors/bind-studio',
        imageUrl: '',
        location: '인천 남동구',
        priceLabel: '20,000원~',
        priceSuffix: '/60분',
        rating: '',
        spaceType: '업체',
        studio: '2개 공간',
        tags: ['공간 2개'],
        title: '바인드 합주실',
      },
    ],
    page: 0,
    size: 20,
    totalCount: 1,
  });
  mockedGetExploreMapMarkers.mockResolvedValue({
    markers: [
      {
        availableRoomCount: 2,
        id: 'studio-bind',
        label: '바인드 합주실',
        lat: 37.4453311,
        lng: 126.6961342,
        spaceOrVendorId: 'bind-studio',
      },
    ],
  });

  render(
    <MemoryRouter initialEntries={['/search/map?q=바인드']}>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  fireEvent.click(await screen.findByRole('button', { name: '마커 바인드 합주실' }));

  await waitFor(() => expect(mockedFetchVendorDetail).toHaveBeenCalledWith('bind-studio'));
  expect(await screen.findByRole('heading', { name: '바인드 합주실' })).toBeInTheDocument();
});
