import { getJson } from './client';
import type {
  PaymentHistoryItemDto,
  PaymentHistoryPageResponseDto,
} from '../data/schemas/payment';

export type PaymentHistoryEntry = PaymentHistoryItemDto;
export type PaymentHistoryKind = PaymentHistoryEntry['kind'];

export function getMyPaymentHistory(
  params: { page?: number; size?: number; signal?: AbortSignal } = {},
) {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 50));
  return getJson<PaymentHistoryPageResponseDto>(
    `/api/v1/users/me/payment-history?${query.toString()}`,
    { signal: params.signal },
  );
}

export function formatPaymentAmountWon(value: number): string {
  return value.toLocaleString('ko-KR');
}
