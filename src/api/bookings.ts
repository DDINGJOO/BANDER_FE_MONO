import { ApiError, getJson, postJson } from './client';
import { getApiBaseUrl } from '../config/publicEnv';

// --- Types ---

export type CreateBookingRequest = {
  roomId: string;
  startsAt: string;
  endsAt: string;
  couponId?: string;
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
  paidAmount: number | null;
  discountWon: number | null;
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

// --- Saga (orchestrator) types ---

export type SagaStartResponse = {
  sagaId: string;
  expiresAt: string;
};

export type SagaStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'COMPENSATING';

export type SagaStatusResponse = {
  status: SagaStatus;
  bookingId?: string;
  paymentId?: string;
  reservationId?: string;
  errorCode?: string;
  updatedAt: string;
  currentStepIndex?: number;
  definition?: string;
};

export type CreateBookingResult =
  | { kind: 'legacy'; booking: BookingCommandResponse }
  | { kind: 'saga'; saga: SagaStartResponse };

// --- Functions ---

type ApiResponseEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

/**
 * Creates a booking. Returns either:
 *  - { kind: 'legacy', booking } when the booking-service responds 200 with a synchronous BookingCommandResponse
 *  - { kind: 'saga', saga }     when the booking-orchestrator responds 202 Accepted with { sagaId, expiresAt }
 *
 * During the gateway canary rollout (BOOKING_SAGA_ROLLOUT_PCT 0~100) both shapes are valid;
 * callers must branch on `kind` and, for saga responses, poll getSagaStatus(sagaId) until COMPLETED/FAILED.
 */
export async function createBooking(req: CreateBookingRequest): Promise<CreateBookingResult> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/v1/bookings`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    throw new ApiError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 0);
  }

  let payload: ApiResponseEnvelope<BookingCommandResponse | SagaStartResponse> | null = null;
  try {
    payload = (await response.json()) as ApiResponseEnvelope<BookingCommandResponse | SagaStartResponse>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success || payload.data === undefined) {
    throw new ApiError(
      payload?.error?.message ?? '요청 처리에 실패했습니다.',
      response.status,
      payload?.error?.code,
    );
  }

  const data = payload.data;
  // Saga response: 202 Accepted, body has sagaId. Legacy: 200, body has bookingId.
  if (response.status === 202 || (data && (data as SagaStartResponse).sagaId !== undefined)) {
    return { kind: 'saga', saga: data as SagaStartResponse };
  }
  return { kind: 'legacy', booking: data as BookingCommandResponse };
}

export function getSagaStatus(sagaId: string, options?: { signal?: AbortSignal }) {
  return getJson<SagaStatusResponse>(`/api/v1/orchestrator/sagas/${sagaId}`, options);
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
