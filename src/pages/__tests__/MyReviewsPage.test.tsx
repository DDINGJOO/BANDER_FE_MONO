import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MyReviewsPage } from '../MyReviewsPage';
import * as bookingsApi from '../../api/bookings';
import * as usersApi from '../../api/users';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeFooter', () => ({
  HomeFooter: () => <div data-testid="home-footer" />,
}));

jest.mock('../../api/bookings', () => ({
  deleteReview: jest.fn(),
  getBookingDetail: jest.fn(),
  getMyReviews: jest.fn(),
}));

jest.mock('../../api/users', () => ({
  getMySummary: jest.fn(),
}));

const mockedDeleteReview = jest.mocked(bookingsApi.deleteReview);
const mockedGetBookingDetail = jest.mocked(bookingsApi.getBookingDetail);
const mockedGetMyReviews = jest.mocked(bookingsApi.getMyReviews);
const mockedGetMySummary = jest.mocked(usersApi.getMySummary);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/my-reviews']}>
      <Routes>
        <Route element={<MyReviewsPage />} path="/my-reviews" />
        <Route element={<div>reservation detail</div>} path="/reservation-detail" />
        <Route element={<div>search page</div>} path="/search" />
      </Routes>
    </MemoryRouter>,
  );
}

function seedAuthSession() {
  window.sessionStorage.setItem(
    'bander.authSession',
    JSON.stringify({
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      gatewayContextToken: 'gateway-context-token',
      userId: '101',
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  mockedGetMySummary.mockResolvedValue({
    couponCountLabel: '0',
    displayName: '뮤지션J',
    email: 'user@example.com',
    pointsLabel: '0P',
    profileImageRef: null,
    profileImageUrl: 'https://cdn.example.com/profile.png',
    reservationBadgeCount: 0,
  });
  mockedDeleteReview.mockResolvedValue(undefined);
});

test('fetches real my reviews and enriches them with booking detail instead of mock rows', async () => {
  seedAuthSession();
  mockedGetMyReviews.mockResolvedValue({
    hasNext: false,
    items: [
      {
        bookingId: '314661115969851392',
        content: '실제 예약에서 작성한 리뷰입니다.',
        createdAt: '2026-05-18T12:34:56',
        imageRefs: [],
        rating: 5,
        reviewId: '9001',
        studioId: '620000000000200000',
        userId: '101',
      },
    ],
    nextCursor: null,
    size: 100,
    totalCount: 1,
  });
  mockedGetBookingDetail.mockResolvedValue({
    bookingId: '314661115969851392',
    bookerName: '홍길동',
    bookerNote: null,
    bookerPhone: '010-0000-0000',
    cancelReason: null,
    cancelledAt: null,
    couponDiscountAmount: null,
    createdAt: '2026-05-18T12:00:00',
    endsAt: '2026-05-20T18:00:00',
    paidAmount: 30000,
    paymentMethod: 'CARD',
    refundAmount: null,
    refundedAt: null,
    reservationAnswers: [],
    roomId: '620000000000200010',
    roomName: 'B룸',
    startsAt: '2026-05-20T15:00:00',
    status: 'COMPLETED',
    studioAddress: '서울 송파구 올림픽로 27 4층',
    studioId: '620000000000200000',
    studioName: '스테이지원 잠실점',
    studioThumbnailUrl: 'https://cdn.example.com/stage-one.png',
    totalPrice: 30000,
  });

  renderPage();

  expect(await screen.findByText('실제 예약에서 작성한 리뷰입니다.')).toBeInTheDocument();
  expect(screen.getByText('스테이지원 잠실점')).toBeInTheDocument();
  expect(screen.getByText('B룸')).toBeInTheDocument();
  expect(screen.getByText('리뷰 1')).toBeInTheDocument();
  expect(screen.queryByText('유스뮤직')).not.toBeInTheDocument();
  expect(mockedGetMyReviews).toHaveBeenCalledWith({ size: 100 });
  expect(mockedGetBookingDetail).toHaveBeenCalledWith('314661115969851392');
});

test('deletes a review through the review API', async () => {
  seedAuthSession();
  mockedGetMyReviews.mockResolvedValue({
    hasNext: false,
    items: [
      {
        bookingId: '314661115969851392',
        content: '삭제할 실제 리뷰입니다.',
        createdAt: '2026-05-18T12:34:56',
        imageRefs: [],
        rating: 4,
        reviewId: '9002',
        studioId: '620000000000200000',
        userId: '101',
      },
    ],
    nextCursor: null,
    size: 100,
    totalCount: 1,
  });
  mockedGetBookingDetail.mockResolvedValue({
    bookingId: '314661115969851392',
    bookerName: '홍길동',
    bookerNote: null,
    bookerPhone: '010-0000-0000',
    cancelReason: null,
    cancelledAt: null,
    couponDiscountAmount: null,
    createdAt: '2026-05-18T12:00:00',
    endsAt: '2026-05-20T18:00:00',
    paidAmount: 30000,
    paymentMethod: 'CARD',
    refundAmount: null,
    refundedAt: null,
    reservationAnswers: [],
    roomId: '620000000000200010',
    roomName: 'B룸',
    startsAt: '2026-05-20T15:00:00',
    status: 'COMPLETED',
    studioAddress: '서울 송파구 올림픽로 27 4층',
    studioId: '620000000000200000',
    studioName: '스테이지원 잠실점',
    studioThumbnailUrl: null,
    totalPrice: 30000,
  });

  renderPage();

  expect(await screen.findByText('삭제할 실제 리뷰입니다.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '삭제' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: '삭제' }));

  await waitFor(() => expect(mockedDeleteReview).toHaveBeenCalledWith('9002'));
  await waitFor(() => expect(screen.queryByText('삭제할 실제 리뷰입니다.')).not.toBeInTheDocument());
  expect(screen.getByText('리뷰 0')).toBeInTheDocument();
  expect(screen.getByText('리뷰가 삭제되었습니다.')).toBeInTheDocument();
});

test('does not show mock reviews to signed-out users', async () => {
  renderPage();

  expect(await screen.findByText('로그인 후 작성한 리뷰를 확인할 수 있습니다.')).toBeInTheDocument();
  expect(screen.queryByText('유스뮤직')).not.toBeInTheDocument();
  expect(mockedGetMyReviews).not.toHaveBeenCalled();
});
