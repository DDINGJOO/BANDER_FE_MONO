import { getJson, postJson } from './client';

// --- Types ---

export type CreateBookingRequest = {
  roomId: string;
  startsAt: string;
  endsAt: string;
};

export type CancelBookingRequest = {
  cancelReason: string;
};

export type ConfirmPaymentRequest = {
  paymentKey: string;
  orderId: string;
  amount: string;
};

export type BookingCommandResponse = {
  bookingId: string;
  status: string;
  expiresAt: string | null;
  totalPrice: number;
  cancelledAt: string | null;
  orderId: string | null;
  paymentId: string | null;
};

export type BookingDetailResponse = {
  bookingId: string;
  roomId: string;
  roomName: string;
  studioName: string;
  status: string;
  startsAt: string;
  endsAt: string;
  totalPrice: number;
  paymentMethod: string | null;
  bookerName: string;
  bookerPhone: string;
  bookerNote: string | null;
  cancelReason: string | null;
  createdAt: string;
};

export type MyBookingItem = {
  bookingId: string;
  studioId: string;
  studioName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPriceWon: number;
  createdAt: string;
};

export type SpaceAvailabilitySlot = {
  startTime: string;
  endTime: string;
  bookable: boolean;
  priceWon: number;
};

export type SpaceAvailabilityResponse = {
  date: string;
  slots: SpaceAvailabilitySlot[];
};

export type CreateReviewRequest = {
  bookingId: string;
  rating: number;
  content: string;
  imageRefs?: string[];
};

export type CursorPageResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number | null;
  size: number;
};

export type RefundEstimateResponse = {
  bookingId: string;
  totalPrice: number;
  refundRatePercent: number;
  cancellationFee: number;
  refundAmount: number;
  cancellable: boolean;
};

// --- Functions ---

export function createBooking(req: CreateBookingRequest) {
  return postJson<BookingCommandResponse>('/api/v1/bookings', req);
}

export function cancelBooking(bookingId: number | string, req: CancelBookingRequest) {
  return postJson<BookingCommandResponse>(`/api/v1/bookings/${bookingId}/cancel`, req);
}

export function confirmPayment(bookingId: number | string, req: ConfirmPaymentRequest) {
  return postJson<BookingCommandResponse>(`/api/v1/bookings/${bookingId}/confirm-payment`, req);
}

export function getBookingDetail(bookingId: number | string) {
  return getJson<BookingDetailResponse>(`/api/v1/bookings/${bookingId}`);
}

export function getMyBookings(params: { tab: string; cursor?: string; size?: number }) {
  const query = new URLSearchParams({ status: params.tab });
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.size != null) query.set('size', String(params.size));
  return getJson<CursorPageResponse<MyBookingItem>>(`/api/v1/users/me/bookings?${query.toString()}`);
}

export function getRefundEstimate(bookingId: number | string) {
  return getJson<RefundEstimateResponse>(`/api/v1/bookings/${bookingId}/refund-estimate`);
}

export function getSpaceAvailability(spaceId: number | string, date: string) {
  return getJson<SpaceAvailabilityResponse>(`/api/v1/spaces/${spaceId}/availability?date=${date}`);
}

export function createReview(req: CreateReviewRequest) {
  return postJson<{ reviewId: string }>('/api/v1/reviews', req);
}

export function getMyReviews(params: { cursor?: string; size?: number } = {}) {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.size != null) query.set('size', String(params.size));
  const qs = query.toString();
  return getJson<CursorPageResponse<{ reviewId: string; bookingId: string; rating: number; content: string; createdAt: string }>>(`/api/v1/users/me/reviews${qs ? `?${qs}` : ''}`);
}
