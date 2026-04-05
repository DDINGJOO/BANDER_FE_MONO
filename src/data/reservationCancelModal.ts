import type { ReservationCancelNoticeRow } from '../components/reservations/ReservationCancelModal';

/** Figma 6419:80535 */
export const RESERVATION_CANCEL_NOTICE_DEFAULT: ReservationCancelNoticeRow[] = [
  { label: '결제 금액', value: '20,000원' },
  { label: '예약 시간', value: '0원' },
  { label: '포인트 환급', value: '0원' },
  { label: '환불 방법', value: '카드 환불' },
  { label: '최종 환불금액', value: '20,000원', emphasis: true },
];

export const RESERVATION_CANCEL_ALERT_DEFAULT =
  '취소 진행 전 취소 수수료와 총 환불 금액을 확인해 주세요.';

export const RESERVATION_CANCEL_LEAD_LINES: [string, string] = [
  '지금 예약 취소 시 ',
  '취소 수수료 0원이 발생합니다.',
];
