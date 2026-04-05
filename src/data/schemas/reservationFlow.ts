/**
 * UC-09 예약·결제 플로우
 * @see docs/BACKEND_API.md §8
 */

export type PaymentClientInfoDto = {
  provider: string;
  clientKey?: string;
  orderId: string;
  amountWon: number;
};

/** POST /api/v1/reservations */
export type CreateReservationRequestDto = {
  spaceSlug: string;
  slotId: string;
  optionIds: string[];
  couponIds: string[];
  note?: string;
};

export type CreateReservationResponseDto = {
  reservationId: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | string;
  payment?: PaymentClientInfoDto;
};

/** POST /api/v1/payments/{provider}/confirm */
export type PaymentConfirmRequestDto = {
  orderId: string;
  paymentKey?: string;
  amountWon: number;
};

export type PaymentConfirmResponseDto = {
  reservationId?: string;
  status: string;
};
