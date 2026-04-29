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

export type OwnedCouponItemDto = {
  id: string;
  couponId: string;
  title: string;
  discountLabel: string;
  expiresAt?: string;
};

/** GET /api/v1/users/me/coupons */
export type UserCouponsResponseDto = {
  items: OwnedCouponItemDto[];
};
