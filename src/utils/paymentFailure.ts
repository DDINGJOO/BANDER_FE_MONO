import { ApiError } from '../api/client';

export type PaymentFailureInfo = {
  code?: string;
  message: string;
};

export const DEFAULT_PAYMENT_FAILURE: PaymentFailureInfo = {
  message: '결제를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.',
};

const PAYMENT_FAILURE_MESSAGES: Record<string, string> = {
  ALREADY_PROCESSED_PAYMENT: '이미 처리된 결제입니다. 예약 현황에서 결제 상태를 확인해주세요.',
  BELOW_MINIMUM_AMOUNT: '결제 가능한 최소 금액보다 낮습니다. 예약 금액을 다시 확인해주세요.',
  EXCEED_MAX_AMOUNT: '결제 가능한 최대 금액을 초과했습니다. 예약 금액을 다시 확인해주세요.',
  FORBIDDEN_REQUEST: '결제 요청 권한이 없습니다. 다시 로그인한 뒤 시도해주세요.',
  INVALID_CARD_COMPANY: '지원하지 않는 카드사입니다. 다른 결제수단을 선택해주세요.',
  INVALID_REQUEST: '결제 요청 정보가 올바르지 않습니다. 예약 정보를 다시 확인해주세요.',
  INVALID_STOPPED_CARD: '사용이 중지된 카드입니다. 다른 카드를 사용해주세요.',
  NOT_ENOUGH_BALANCE: '카드 한도나 잔액이 부족합니다. 다른 결제수단을 사용해주세요.',
  NOT_FOUND_PAYMENT: '결제 정보를 찾을 수 없습니다. 예약을 다시 진행해주세요.',
  PAY_PROCESS_CANCELED: '결제가 취소되었습니다.',
  PAYMENT_CONFIG_MISSING: '결제 설정이 아직 준비되지 않았습니다. 관리자에게 문의해주세요.',
  PAYMENT_TIMEOUT: '결제 확인 시간이 초과되었습니다. 예약 상태를 확인한 뒤 다시 시도해주세요.',
  PROVIDER_ERROR: '결제사 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다. 카드 상태를 확인하거나 다른 결제수단을 사용해주세요.',
  UNAUTHORIZED_KEY: '결제 인증 정보가 올바르지 않습니다. 관리자에게 문의해주세요.',
  USER_CANCEL: '결제를 취소했습니다.',
};

function readErrorField(error: unknown, field: 'code' | 'message'): string | undefined {
  if (error && typeof error === 'object' && field in error) {
    const value = (error as Record<string, unknown>)[field];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
  return undefined;
}

export function normalizePaymentFailure(error: unknown, fallback = DEFAULT_PAYMENT_FAILURE.message): PaymentFailureInfo {
  const code = error instanceof ApiError
    ? error.code
    : readErrorField(error, 'code');
  const rawMessage = error instanceof Error
    ? error.message
    : readErrorField(error, 'message');
  const mappedMessage = code ? PAYMENT_FAILURE_MESSAGES[code] : undefined;

  return {
    code,
    message: mappedMessage ?? rawMessage ?? fallback,
  };
}

export function paymentFailureFromSearchParams(searchParams: URLSearchParams): PaymentFailureInfo {
  return normalizePaymentFailure({
    code: searchParams.get('code') ?? undefined,
    message: searchParams.get('message') ?? undefined,
  }, '결제가 취소되었거나 실패했습니다.');
}

export function roomDetailPathFromPaymentContext(searchParams: URLSearchParams): string {
  const roomSlug = searchParams.get('roomSlug') || sessionStorage.getItem('bander_pending_room_slug');
  return roomSlug ? `/spaces/${roomSlug}` : '/';
}
