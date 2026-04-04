/**
 * Figma: 적용 가능 쿠폰 모달
 * - 다운로드 전: 6426-24604 · 완료: 6426-24729
 * - 사용가능 룸 패널: 6426-24839
 * https://www.figma.com/design/EoBH3U1mU3oQBMTnpOO2r8/…
 */
export const COUPON_USAGE_ROOMS = [
  'A룸 그랜드 피아노 대관',
  'A2룸 합주실(대형)',
  'B룸 보컬트레이닝 전용',
] as const;

export type CouponDownloadItem = {
  id: string;
  metaNote: string | null;
  subtitle: string;
  terms: readonly string[];
  usageSummary: string | null;
  valueMain: string;
};

export const COUPON_ITEMS: readonly CouponDownloadItem[] = [
  {
    id: 'coupon-3000',
    metaNote: null,
    subtitle: '[유스뮤직 전용]',
    terms: ['조건 : 최대 10,000원 이상 결제 시', '기한 : 2025.09.13까지'],
    usageSummary: '사용가능 : A룸 그랜드 피아노 대관 외 3',
    valueMain: '3,000원',
  },
  {
    id: 'coupon-5',
    metaNote: null,
    subtitle: '[유스뮤직 전용]',
    terms: ['조건 : 최대 10,000원 이상 결제 시', '기한 : 2025.09.13까지'],
    usageSummary: null,
    valueMain: '5%',
  },
  {
    id: 'coupon-10',
    metaNote: '최대 10,000원 할인 가능',
    subtitle: '평일 낮시간 전용 할인 쿠폰',
    terms: ['조건 : 월~금 사용 가능 / 60분 이상 예약', '기한 : 2025.09.13까지'],
    usageSummary: null,
    valueMain: '10%',
  },
];
