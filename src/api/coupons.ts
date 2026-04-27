import { getJson, postJson } from './client';
import {
  type CouponClaimResponseDto,
  type CouponsAvailableResponseDto,
  type UserCouponsResponseDto,
} from '../data/schemas/coupon';

export function getAvailableCoupons(spaceSlug?: string, options?: { signal?: AbortSignal }) {
  const query = spaceSlug ? `?spaceSlug=${encodeURIComponent(spaceSlug)}` : '';
  return getJson<CouponsAvailableResponseDto>(`/api/v1/coupons/available${query}`, options);
}

export function claimCoupon(couponId: string) {
  return postJson<CouponClaimResponseDto>(`/api/v1/coupons/${encodeURIComponent(couponId)}/claim`, {});
}

export function getMyCoupons(options?: { signal?: AbortSignal }) {
  return getJson<UserCouponsResponseDto>('/api/v1/users/me/coupons', options);
}
