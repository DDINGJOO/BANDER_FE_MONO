/**
 * UC-16 쿠폰
 * @see docs/BACKEND_API.md §15
 */

export type CouponAvailableItemDto = {
  id: string;
  title: string;
  discountLabel: string;
  discountType?: 'FIXED' | 'PERCENT';
  discountValue?: number;
  maxDiscountWon?: number | null;
  minPurchaseWon?: number | null;
  validUntilLabel?: string;
  spaceSlug?: string;
};

/** GET /api/v1/coupons/available?spaceSlug= */
export type CouponsAvailableResponseDto = {
  coupons: CouponAvailableItemDto[];
};

/** POST /api/v1/coupons/{couponId}/claim */
export type CouponClaimResponseDto = {
  ownedCouponId: string;
};

/** 쿠폰 사용 범위 (BE: ScopeType enum) */
export type CouponScopeType = 'ALL' | 'ROOM_LIST';

export type OwnedCouponItemDto = {
  id: string;
  couponId: string;
  title: string;
  discountLabel: string;
  expiresAt?: string;
  /** 최소 주문금액 (PR #459) */
  minPurchaseWon?: number | null;
  /** 최대 적용금액 — PERCENT 쿠폰의 cap. nullable (PR #459) */
  maxDiscountWon?: number | null;
  /** 쿠폰 사용 범위 종류 (PR #459). 미지정 시 ALL 로 간주. */
  scopeType?: CouponScopeType;
  /**
   * 사용 가능 공간명 스냅샷 (PR #459). scopeType=ALL 이면 null.
   */
  scopeRoomNames?: string[] | null;
  /**
   * 사용 가능 공간 slug 스냅샷 (BE PR #460). scopeRoomNames 와 같은 인덱스로 매칭.
   * 삭제된 공간이면 해당 인덱스가 null. scopeType=ALL 이면 null.
   */
  scopeRoomSlugs?: (string | null)[] | null;
};

/** GET /api/v1/users/me/coupons */
export type UserCouponsResponseDto = {
  items: OwnedCouponItemDto[];
};
