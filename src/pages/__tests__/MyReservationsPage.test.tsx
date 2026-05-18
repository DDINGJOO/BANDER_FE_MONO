import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MyReservationsPage } from '../MyReservationsPage';
import * as bookingsApi from '../../api/bookings';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeFooter', () => ({
  HomeFooter: () => <div data-testid="home-footer" />,
}));

jest.mock('../../api/bookings', () => ({
  cancelBooking: jest.fn(),
  getMyBookings: jest.fn(),
  getMyReviews: jest.fn(),
  getRefundEstimate: jest.fn(),
}));

const mockedGetMyBookings = jest.mocked(bookingsApi.getMyBookings);
const mockedGetMyReviews = jest.mocked(bookingsApi.getMyReviews);

function renderPage(initialEntry = '/my-reservations') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MyReservationsPage />} path="/my-reservations" />
        <Route element={<div>reservation detail</div>} path="/reservation-detail" />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.sessionStorage.setItem(
    'bander.authSession',
    JSON.stringify({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      gatewayContextToken: 'gateway-context-token',
      userId: '101',
    }),
  );
  mockedGetMyReviews.mockResolvedValue({
    hasNext: false,
    items: [],
    nextCursor: null,
    size: 100,
    totalCount: 0,
  });
});

test('shows reservation status, room, vendor, thumbnail, date, time, and paid price', async () => {
  mockedGetMyBookings.mockResolvedValue({
    hasNext: false,
    items: [
      {
        bookingId: '314661115969851392',
        createdAt: '2026-05-18T12:00:00',
        date: '2026-05-20',
        endTime: '18:00:00',
        paidAmount: 45000,
        refundAmount: null,
        roomId: '620000000000200010',
        roomName: 'B룸',
        startTime: '15:00:00',
        status: 'CONFIRMED',
        studioId: '620000000000200000',
        studioName: '스테이지원 잠실점',
        studioThumbnailUrl: 'https://cdn.example.com/stage-one.png',
        totalPriceWon: 50000,
      },
    ],
    nextCursor: null,
    size: 20,
    totalCount: 1,
  });

  renderPage('/my-reservations?tab=upcoming');

  const card = await screen.findByText('B룸');
  const article = card.closest('article');
  expect(article).toBeInTheDocument();

  expect(within(article as HTMLElement).getByText('예약확정')).toBeInTheDocument();
  expect(within(article as HTMLElement).getByText('스테이지원 잠실점')).toBeInTheDocument();
  expect(article?.querySelector('.my-res-card__thumb')).toHaveAttribute('src', 'https://cdn.example.com/stage-one.png');
  expect(within(article as HTMLElement).getByText('26.05.20 (수)')).toBeInTheDocument();
  expect(within(article as HTMLElement).getByText('15:00 ~ 18:00 (총 3시간 이용)')).toBeInTheDocument();
  expect(within(article as HTMLElement).getByText('45,000원')).toBeInTheDocument();
});

test('shows canceled reservations with a red struck payment price and refund amount', async () => {
  mockedGetMyBookings.mockResolvedValue({
    hasNext: false,
    items: [
      {
        bookingId: '314661115969851393',
        cancelledAt: '2026-05-18T14:00:00',
        createdAt: '2026-05-18T12:00:00',
        date: '2026-05-21',
        endTime: '17:00:00',
        paidAmount: 60000,
        refundAmount: 50000,
        refundedAt: '2026-05-18T14:10:00',
        roomId: '620000000000200011',
        roomName: 'A룸',
        startTime: '14:00:00',
        status: 'REFUNDED',
        studioId: '620000000000200000',
        studioName: '스테이지원 잠실점',
        studioThumbnailUrl: null,
        totalPriceWon: 60000,
      },
    ],
    nextCursor: null,
    size: 20,
    totalCount: 1,
  });

  renderPage('/my-reservations?tab=canceled');

  const card = await screen.findByText('A룸');
  const article = card.closest('article') as HTMLElement;
  const paid = within(article).getByText('-60,000원');

  expect(within(article).getByText('예약취소')).toBeInTheDocument();
  expect(paid).toHaveClass('my-res-card__price--canceled');
  expect(within(article).getByText('50,000원')).toHaveClass('my-res-card__refund');
});
