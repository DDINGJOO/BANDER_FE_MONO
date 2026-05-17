import { getJson, postJson } from './client';
import {
  type CouponClaimResponseDto,
  type CouponsAvailableResponseDto,
  type UserCouponsResponseDto,
} from '../data/schemas/coupon';

/**
 * 적용 가능한 쿠폰 조회.
 *
 * - `roomId`: 방 단위 필터의 canonical key (ROOM_LIST 쿠폰의 우선 매칭 대상).
 * - `spaceSlug`: legacy 방 단위 필터 fallback.
 * - `vendorId`: 업체 owner user id (BE 의 `Coupon.issuerId` 와 매칭).
 *   미전송 시 PLATFORM 발급 쿠폰만 노출 — 다른 점주의 VENDOR 쿠폰 회귀 차단.
 * - 응답의 `claimed` 로 "받기 / 보유중" 분기. 비로그인은 항상 false.
 */
export function getAvailableCoupons(
  spaceSlug?: string,
  vendorId?: string | null,
  options?: { roomId?: string | null; signal?: AbortSignal }
) {
  const params = new URLSearchParams();
  if (options?.roomId) params.set('roomId', options.roomId);
  if (spaceSlug) params.set('spaceSlug', spaceSlug);
  if (vendorId) params.set('vendorId', vendorId);
  const query = params.toString();
  return getJson<CouponsAvailableResponseDto>(
    `/api/v1/coupons/available${query ? `?${query}` : ''}`,
    options
  );
}

export function claimCoupon(couponId: string) {
  return postJson<CouponClaimResponseDto>(`/api/v1/coupons/${encodeURIComponent(couponId)}/claim`, {});
}

export function getMyCoupons(options?: { signal?: AbortSignal }) {
  return getJson<UserCouponsResponseDto>('/api/v1/users/me/coupons', options);
}
