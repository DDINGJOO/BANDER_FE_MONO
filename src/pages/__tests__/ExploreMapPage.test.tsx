import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  getExploreMapMarkers,
  getExploreMapPopularVendors,
  getExploreMapSpaces,
} from '../../api/exploreMap';
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
    markers = [],
  }: {
    center: { lat: number; lng: number };
    markers?: unknown[];
  }) => (
    <div
      data-center={`${center.lat},${center.lng}`}
      data-marker-count={markers.length}
      data-testid="explore-map"
    />
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

const mockedGetExploreMapMarkers = getExploreMapMarkers as jest.MockedFunction<typeof getExploreMapMarkers>;
const mockedGetExploreMapPopularVendors = getExploreMapPopularVendors as jest.MockedFunction<
  typeof getExploreMapPopularVendors
>;
const mockedGetExploreMapSpaces = getExploreMapSpaces as jest.MockedFunction<typeof getExploreMapSpaces>;

beforeEach(() => {
  mockedGetExploreMapSpaces.mockReset();
  mockedGetExploreMapMarkers.mockReset();
  mockedGetExploreMapPopularVendors.mockReset();

  mockedGetExploreMapSpaces.mockResolvedValue({
    hasNext: false,
    items: [],
    page: 0,
    size: 20,
    totalCount: 0,
  });
  mockedGetExploreMapMarkers.mockResolvedValue({ markers: [] });
  mockedGetExploreMapPopularVendors.mockResolvedValue({ vendors: [] });
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

test('searches inside the map page and recenters the map to the first result marker', async () => {
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
    <MemoryRouter initialEntries={['/search/map']}>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText('지도 검색'), { target: { value: '바인드' } });
  fireEvent.click(screen.getByRole('button', { name: '검색' }));

  await waitFor(() => {
    expect(mockedGetExploreMapSpaces).toHaveBeenLastCalledWith(expect.objectContaining({ q: '바인드' }));
  });
  await waitFor(() => {
    expect(screen.getByTestId('explore-map')).toHaveAttribute('data-center', '37.4453311,126.6961342');
  });
});
