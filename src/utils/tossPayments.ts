import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

export interface TossPaymentParams {
  clientKey: string;
  orderId: string;
  orderName: string;
  amount: number;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
  /**
   * Optional Toss customerKey. Saga path (PR-2.8a) supplies the backend-issued
   * key from the polling response; legacy path falls back to anonymous.
   */
  customerKey?: string;
}

export async function requestTossPayment(params: TossPaymentParams): Promise<void> {
  const tossPayments = await loadTossPayments(params.clientKey);
  const payment = tossPayments.payment({ customerKey: params.customerKey ?? 'ANONYMOUS' });

  await payment.requestPayment({
    method: 'CARD',
    amount: {
      currency: 'KRW',
      value: params.amount,
    },
    orderId: params.orderId,
    orderName: params.orderName,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
  });
}
