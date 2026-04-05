/**
 * UC-15 결제 정보·내역
 * @see docs/BACKEND_API.md §14
 */

import type { ApiOffsetPageDto } from './common';

export type PaymentMethodDto = {
  id: string;
  brand: string;
  last4: string;
  isDefault: boolean;
};

export type PaymentMethodsResponseDto = {
  methods: PaymentMethodDto[];
};

export type PaymentHistoryItemDto = {
  id: string;
  kind: 'payment' | 'refund';
  title: string;
  dateLabel: string;
  amountWon: number;
};

export type PaymentHistoryPageResponseDto = ApiOffsetPageDto<PaymentHistoryItemDto>;
