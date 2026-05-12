/**
 * Figma: 6225:16537 승인대기 · 6419:79716 예약확정 · 6419:79947 이용완료
 * 백엔드 계약: {@link import('./schemas/reservations').ReservationDetailResponseDto}
 */

import { buildChatHref } from '../lib/chatRoutes';

export type ReservationDetailVariant = 'pending' | 'confirmed' | 'completed';

export function parseReservationDetailVariant(
  value: string | null,
): ReservationDetailVariant {
  if (value === 'pending' || value === 'confirmed' || value === 'completed') {
    return value;
  }
  return 'confirmed';
}

/** 정적 지도 이미지 (6419:79716 단일 레이어와 동일 계열) */
export const RESERVATION_DETAIL_MAP_IMAGE =
  'https://www.figma.com/api/mcp/asset/8607b948-1cb5-45db-abb3-62b28bb430a6';

export const RESERVATION_DETAIL = {
  spaceTitle: 'A룸 그랜드 피아노 대관',
  address: '서울시 마포구 독막로9길 31 지하 1층',
  thumbUrl:
    'https://www.figma.com/api/mcp/asset/e9e77d90-6f2a-4b28-8d5b-710752d383da',
  schedule: {
    dateShort: '25.08.13 (수) 16:00',
    range: '25.08.13 (수) 16:00 ~ 17:00 ',
    peopleLine: '총 1시간 이용',
    options: 'Guitar 추가 X 1, Piano 추가 X 1',
  },
  booker: {
    reservationNo: '20250109ATEC123',
    name: '류지예',
    phone: '010-1234-5678',
  },
  priceLine: '20,000원',
  payment: {
    space: '10,000원',
    option: '10,000원',
    pointLine: '- 0원',
    couponLine: '- 0원',
    paid: '20,000원',
    method: '카드결제(국민)',
  },
  /** 예약확정 화면 헤더 우측 (6419:79716) */
  confirmedHeadline: '15일 15시간 44분 뒤 입실 가능',
} as const;

/**
 * ADR-002 (2026-05-12) — 시간 기반 자동 환불 정책.
 * 점주 승인 단계 폐기 → 환불 요청 즉시 정책에 따라 자동 환불.
 * 백엔드: {@link com.bander.order.booking.booking.service.CancellationPolicyService}
 */
export const RESERVATION_REFUND_POLICY = {
  lead: '환불은 시간 기반 정책에 따라 즉시 자동 처리됩니다. 영업일 기준 3-5일 내 결제 수단으로 환불 입금됩니다.',
  rules: [
    '이용 시작 7일 이전 : 100% 환불 (수수료 0%)',
    '이용 시작 3-7일 이전 : 90% 환불 (수수료 10%)',
    '이용 시작 1-3일 이전 : 70% 환불 (수수료 30%)',
    '이용 시작 12-24시간 이전 : 50% 환불 (수수료 50%)',
    '이용 시작 12시간 이내 : 환불 불가',
  ],
} as const;

export function reservationDetailHref(variant: ReservationDetailVariant) {
  return `/reservation-detail?status=${variant}`;
}

/** 예약 상세와 동일 데모 컨텍스트의 채팅방 */
export function reservationDetailChatHref(): string {
  return buildChatHref({
    space: 'a-room-grand-piano-rental',
    vendor: 'youth-music',
  });
}
