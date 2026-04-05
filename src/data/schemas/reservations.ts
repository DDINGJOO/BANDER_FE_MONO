/**
 * UC-10 내 예약·예약 상세
 * @see docs/BACKEND_API.md §9
 */

import type { ApiOffsetPageDto } from './common';

export type MyReservationTabDto = 'upcoming' | 'past' | 'canceled';

export type MyReservationStatusDto =
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'canceledUser'
  | 'canceledVendor';

export type MyReservationActionDto = 'cancel' | 'writeReview' | 'viewMyReview' | 'none';

export type MyReservationDetailRowDto = { label: string; value: string };

/** GET /api/v1/users/me/reservations 한 행 */
export type MyReservationListItemDto = {
  id: string;
  tab: MyReservationTabDto;
  status: MyReservationStatusDto;
  reservationNo: string;
  headlineRight?: string | null;
  headlineAccent?: 'primary' | 'muted' | null;
  spaceTitle: string;
  vendorName: string;
  thumbUrl: string;
  dateTimeLine?: string;
  durationLine?: string;
  detailPath: string;
  action: MyReservationActionDto;
  detailRows?: MyReservationDetailRowDto[];
};

export type MyReservationsPageResponseDto = ApiOffsetPageDto<MyReservationListItemDto>;

export type ReservationScheduleBlockDto = {
  dateShort: string;
  range: string;
  peopleLine: string;
  options?: string;
};

export type ReservationBookerDto = {
  reservationNo: string;
  name: string;
  phone: string;
};

export type ReservationPaymentBreakdownDto = {
  space: string;
  option: string;
  pointLine: string;
  couponLine: string;
  paid: string;
  method: string;
};

/** GET /api/v1/reservations/{id} — 상세 풀 필드 (문서 + 프론트 reservationDetail 정렬) */
export type ReservationDetailResponseDto = {
  id: string;
  status: MyReservationStatusDto;
  spaceTitle: string;
  address: string;
  thumbUrl: string;
  schedule: ReservationScheduleBlockDto;
  booker: ReservationBookerDto;
  priceLine: string;
  payment: ReservationPaymentBreakdownDto;
  confirmedHeadline?: string;
  mapImageUrl?: string;
  refundPolicy?: { lead: string; rules: string[] };
  chatThreadId?: string;
};

/** POST /api/v1/reservations/{id}/cancel */
export type CancelReservationRequestDto = { reason?: string | null };

export type CancelReservationResponseDto = {
  id: string;
  status: string;
};
