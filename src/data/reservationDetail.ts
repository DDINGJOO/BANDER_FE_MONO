/**
 * Figma: 6225:16537 승인대기 · 6419:79716 예약확정 · 6419:79947 이용완료
 */

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

export const RESERVATION_REFUND_POLICY = {
  lead: '이용당일(첫 날) 이후에 환불 관련 사항은 업체에 채팅으로 직접 문의하셔야합니다.',
  rules: [
    '이용 5일전 : 총 금액의 100% 환불',
    '이용 4일전 : 총 금액의 80% 환불',
    '이용 3일전 : 총 금액의 60% 환불',
    '이용 2일전 : 총 금액의 40% 환불',
    '이용 1일전 및 당일 : 환불 불가',
  ],
} as const;

export function reservationDetailHref(variant: ReservationDetailVariant) {
  return `/reservation-detail?status=${variant}`;
}
