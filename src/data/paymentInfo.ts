/** Figma 6419:86785 — 결제 내역 데모 (API 연동 시 교체) */

import type { PaymentHistoryItemDto } from './schemas/payment';

export type PaymentHistoryEntry = PaymentHistoryItemDto;
export type PaymentHistoryKind = PaymentHistoryEntry['kind'];

export const PAYMENT_HISTORY_ENTRIES: PaymentHistoryEntry[] = [
  {
    id: '1',
    kind: 'payment',
    title: '[유스뮤직] A룸 그랜드 피아노 대관 예약',
    dateLabel: '25.08.10',
    amountWon: 15000,
  },
  {
    id: '2',
    kind: 'refund',
    title: '[유스뮤직] A룸 그랜드 피아노 대관 취소 (100% 환불)',
    dateLabel: '25.08.10',
    amountWon: 10000,
  },
  {
    id: '3',
    kind: 'payment',
    title: '[유스뮤직] A2룸 합주실(대형)',
    dateLabel: '25.08.10',
    amountWon: 15000,
  },
  {
    id: '4',
    kind: 'payment',
    title: '[유스뮤직] A2룸 합주실(대형)',
    dateLabel: '25.08.10',
    amountWon: 15000,
  },
  {
    id: '5',
    kind: 'payment',
    title: '[유스뮤직] A2룸 합주실(대형)',
    dateLabel: '25.08.10',
    amountWon: 15000,
  },
  {
    id: '6',
    kind: 'refund',
    title: '[유스뮤직] A룸 그랜드 피아노 대관 취소 (100% 환불)',
    dateLabel: '25.08.10',
    amountWon: 10000,
  },
];

export function formatPaymentAmountWon(value: number): string {
  return value.toLocaleString('ko-KR');
}
