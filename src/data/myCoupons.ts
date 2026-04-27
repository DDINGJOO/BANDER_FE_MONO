/**
 * Figma 6150:34784 (기본) / 6419:78802 (쿠폰 코드 입력 포커스) — 쿠폰
 * 서버 연동 시 대체 대상: GET /api/v1/users/me/coupons
 *   - 응답 타입은 schemas/coupon.ts 의 OwnedCouponItemDto 참고
 */

export type CouponStatus = 'OWNED' | 'USED' | 'EXPIRED';

export type MyCoupon = {
  id: string;
  status: CouponStatus;
  /** 예: "[유스뮤직 전용]", "평일 낮시간 전용 할인 쿠폰" */
  label: string;
  /** 예: "3,000원", "5%", "10%" */
  discountValue: string;
  /** 예: "사용가능 : A룸 그랜드 피아노 대관 외 3 " — 미제공 시 생략 */
  availableLine?: string;
  /** 예: "최대 10,000원 할인 가능" — 미제공 시 생략 */
  capLine?: string;
  /** 예: "조건 : 최대 10,000원 이상 결제 시" */
  conditionLine: string;
  /** 예: "기한 : 2025.09.13까지" */
  expiryLine: string;
};

export const MY_COUPONS: MyCoupon[] = [
  {
    id: 'coupon-1',
    status: 'OWNED',
    label: '[유스뮤직 전용]',
    discountValue: '3,000원',
    availableLine: '사용가능 : A룸 그랜드 피아노 대관 외 3',
    conditionLine: '조건 : 최대 10,000원 이상 결제 시',
    expiryLine: '기한 : 2025.09.13까지',
  },
  {
    id: 'coupon-2',
    status: 'OWNED',
    label: '[유스뮤직 전용]',
    discountValue: '5%',
    conditionLine: '조건 : 최대 10,000원 이상 결제 시',
    expiryLine: '기한 : 2025.09.13까지',
  },
  {
    id: 'coupon-3',
    status: 'OWNED',
    label: '평일 낮시간 전용 할인 쿠폰',
    discountValue: '10%',
    capLine: '최대 10,000원 할인 가능',
    conditionLine: '조건 : 월~금 사용 가능 / 60분 이상 예약',
    expiryLine: '기한 : 2025.09.13까지',
  },
];
