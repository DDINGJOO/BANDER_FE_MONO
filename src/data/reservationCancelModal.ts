import type { ReservationCancelNoticeRow } from '../components/reservations/ReservationCancelModal';
import type { RefundEstimateResponse } from '../api/bookings';

/** Figma 6419:80535 — 기본 목업 (API 미연결 시 fallback) */
export const RESERVATION_CANCEL_NOTICE_DEFAULT: ReservationCancelNoticeRow[] = [
  { label: '결제 금액', value: '20,000원' },
  { label: '취소 수수료', value: '0원' },
  { label: '최종 환불금액', value: '20,000원', emphasis: true },
];

export const RESERVATION_CANCEL_ALERT_DEFAULT =
  '취소 진행 전 취소 수수료와 총 환불 금액을 확인해 주세요.';

export const RESERVATION_CANCEL_LEAD_LINES: [string, string] = [
  '지금 예약 취소 시 ',
  '취소 수수료 0원이 발생합니다.',
];

export function buildCancelNoticeRows(estimate: RefundEstimateResponse): ReservationCancelNoticeRow[] {
  return [
    { label: '결제 금액', value: `${estimate.totalPrice.toLocaleString()}원` },
    { label: '취소 수수료', value: `${estimate.cancellationFee.toLocaleString()}원` },
    { label: '환불 비율', value: `${estimate.refundRatePercent}%` },
    { label: '최종 환불금액', value: `${estimate.refundAmount.toLocaleString()}원`, emphasis: true },
  ];
}

export function buildCancelLeadLines(estimate: RefundEstimateResponse): [string, string] {
  return [
    '지금 예약 취소 시 ',
    `취소 수수료 ${estimate.cancellationFee.toLocaleString()}원이 발생합니다.`,
  ];
}
