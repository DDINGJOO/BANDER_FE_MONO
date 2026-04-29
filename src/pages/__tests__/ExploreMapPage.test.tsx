import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  getExploreMapMarkers,
  getExploreMapPopularVendors,
  getExploreMapSpaces,
} from '../../api/exploreMap';
import { ExploreMapPage } from '../ExploreMapPage';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeSpaceExplorer', () => ({
  HomeSpaceExplorer: () => <div data-testid="space-filter" />,
}));

jest.mock('../../components/map/KakaoMapView', () => ({
  KakaoMapView: ({ markers = [] }: { markers?: unknown[] }) => (
    <div data-marker-count={markers.length} data-testid="explore-map" />
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
  expect(screen.queryByRole('button', { name: /지도 안 합주실/ })).not.toBeInTheDocument();
  expect(screen.queryByText('A룸 그랜드 피아노 대관')).not.toBeInTheDocument();
  expect(screen.queryByText('서울 마포구 인기 합주실')).not.toBeInTheDocument();
});

test('exposes a mobile map list toggle for backend practice rooms', async () => {
  mockedGetExploreMapSpaces.mockResolvedValueOnce({
    hasNext: false,
    items: [
      {
        bookmarkSaved: false,
        detailPath: '/spaces/a-room-grand-piano-rental',
        imageUrl: 'https://cdn.example.com/a-room.png',
        location: '서울 마포구 서교동',
        priceLabel: '10,000원',
        priceSuffix: '/60분',
        rating: '4.5',
        spaceType: '합주실',
        studio: '업비트스튜디오',
        tags: ['주차가능', '예약가능'],
        title: 'A룸 그랜드 피아노 대관',
      },
      {
        bookmarkSaved: true,
        detailPath: '/spaces/upright-room',
        imageUrl: 'https://cdn.example.com/upright-room.png',
        location: '서울 마포구 동교동',
        priceLabel: '12,000원',
        priceSuffix: '/60분',
        rating: '4.7',
        spaceType: '연습실',
        studio: '서울스트리트퍼포먼스',
        tags: ['예약가능'],
        title: '업라이트 피아노 연습실',
      },
    ],
    page: 0,
    size: 20,
    totalCount: 2,
  });
  mockedGetExploreMapMarkers.mockResolvedValueOnce({
    markers: [
      {
        availableRoomCount: 1,
        id: 'marker-1',
        label: 'A룸 그랜드 피아노 대관',
        lat: 37.555,
        lng: 126.923,
        spaceOrVendorId: 'a-room-grand-piano-rental',
      },
    ],
  });

  render(
    <MemoryRouter>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  const toggle = await screen.findByRole('button', { name: /지도 안 합주실 2곳 목록 보기/ });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByTestId('explore-map')).toHaveAttribute('data-marker-count', '1');

  fireEvent.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: /지도 안 합주실 2곳 접기/ })).toBeInTheDocument();
});
