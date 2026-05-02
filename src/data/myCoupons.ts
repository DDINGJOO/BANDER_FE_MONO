/**
 * Figma 6150:34784 (기본) / 6419:78802 (쿠폰 코드 입력 포커스) — 쿠폰
 * 서버 연동 시 대체 대상: GET /api/v1/users/me/coupons
 *   - 응답 타입은 schemas/coupon.ts 의 OwnedCouponItemDto 참고
 */

import type { CouponScopeType } from './schemas/coupon';

export type CouponStatus = 'OWNED' | 'USED' | 'EXPIRED';

/** 쿠폰 카드에 노출되는 공간 항목. slug 는 BE 미제공 — 향후 확장 시 사용. */
export type CouponScopeRoom = {
  /** 공간명 스냅샷 */
  name: string;
  /** /spaces/{slug} 라우팅용. 현재 BE 미제공이라 항상 null. */
  slug: string | null;
};

export type MyCoupon = {
  id: string;
  status: CouponStatus;
  /** 예: "[유스뮤직 전용]", "평일 낮시간 전용 할인 쿠폰" */
  label: string;
  /** 예: "3,000원", "5%", "10%" */
  discountValue: string;
  /** 예: "모든 공간에서 사용 가능" / "A룸 그랜드 피아노 대관" / "A룸 외 3곳" */
  availableLine?: string;
  /** 좌측 보조 라인 (사용 안 함 — 후방 호환). */
  capLine?: string;
  /** 우측 capLine: "최대 10,000원 할인" — 미제공 시 생략 */
  capLineRight?: string;
  /** 예: "조건 : 10,000원 이상 결제 시" */
  conditionLine: string;
  /** 예: "기한 : 2025.09.13까지" */
  expiryLine: string;
  /** 쿠폰 사용 범위 (PR #459). 기본값 ALL. */
  scopeType: CouponScopeType;
  /** 펼치기 영역에 보일 공간 리스트. ALL 이면 빈 배열. */
  scopeRooms: CouponScopeRoom[];
};

export const MY_COUPONS: MyCoupon[] = [
  {
    id: 'coupon-1',
    status: 'OWNED',
    label: '[유스뮤직 전용]',
    discountValue: '3,000원',
    availableLine: 'A룸 그랜드 피아노 대관 외 3곳',
    conditionLine: '조건 : 10,000원 이상 결제 시',
    expiryLine: '기한 : 2025.09.13까지',
    scopeType: 'ROOM_LIST',
    scopeRooms: [
      { name: 'A룸 그랜드 피아노 대관', slug: null },
      { name: 'B룸 업라이트 피아노', slug: null },
      { name: 'C룸 디지털 피아노', slug: null },
      { name: 'D룸 합주실', slug: null },
    ],
  },
  {
    id: 'coupon-2',
    status: 'OWNED',
    label: '[유스뮤직 전용]',
    discountValue: '5%',
    availableLine: '모든 공간에서 사용 가능',
    conditionLine: '조건 : 10,000원 이상 결제 시',
    expiryLine: '기한 : 2025.09.13까지',
    scopeType: 'ALL',
    scopeRooms: [],
  },
  {
    id: 'coupon-3',
    status: 'OWNED',
    label: '평일 낮시간 전용 할인 쿠폰',
    discountValue: '10%',
    availableLine: '모든 공간에서 사용 가능',
    capLineRight: '최대 10,000원 할인',
    conditionLine: '조건 : 월~금 사용 가능 / 60분 이상 예약',
    expiryLine: '기한 : 2025.09.13까지',
    scopeType: 'ALL',
    scopeRooms: [],
  },
];
