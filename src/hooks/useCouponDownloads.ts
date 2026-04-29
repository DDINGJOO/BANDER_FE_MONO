import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { claimCoupon, getMyCoupons } from '../api/coupons';
import { isMockMode } from '../config/publicEnv';
import { loadAuthSession } from '../data/authSession';
import { COUPON_ITEMS } from '../data/couponDownloadModal';
import { OwnedCouponItemDto } from '../data/schemas/coupon';
import { useToast } from '../components/ui/ToastProvider';

const STORAGE_KEY = 'bander_fe_downloaded_coupon_ids';

function readStoredIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * 룸 상세·예약 등에서 동일 쿠폰 다운로드 상태를 공유 (로컬 저장).
 */
export function useCouponDownloads() {
  const [downloadedCouponIds, setDownloadedCouponIds] = useState<string[]>(readStoredIds);
  const [ownedCoupons, setOwnedCoupons] = useState<OwnedCouponItemDto[]>([]);
  const [loadingOwnedCoupons, setLoadingOwnedCoupons] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloadedCouponIds));
  }, [downloadedCouponIds]);

  const refreshOwnedCoupons = useCallback(async (options?: { signal?: AbortSignal }) => {
    if (isMockMode() || !loadAuthSession()) {
      return;
    }
    setLoadingOwnedCoupons(true);
    try {
      const response = await getMyCoupons(options);
      setOwnedCoupons(response.items);
      setDownloadedCouponIds(response.items.map((item) => item.couponId));
    } finally {
      setLoadingOwnedCoupons(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refreshOwnedCoupons({ signal: controller.signal }).catch(() => undefined);
    return () => controller.abort();
  }, [refreshOwnedCoupons]);

  const downloadCoupon = useCallback(async (id: string) => {
    setDownloadError(null);
    if (isMockMode()) {
      setDownloadedCouponIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      showToast({ message: '쿠폰을 받았어요.', type: 'success' });
      return;
    }
    try {
      await claimCoupon(id);
      await refreshOwnedCoupons();
      showToast({ message: '쿠폰을 받았어요.', type: 'success' });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'COUPON-002') {
        await refreshOwnedCoupons();
        showToast({ message: error.message || '이미 발급된 쿠폰입니다.', type: 'info' });
        return;
      }
      const message = error instanceof Error ? error.message : '쿠폰 다운로드에 실패했습니다.';
      setDownloadError(message);
      showToast({ message, type: 'error' });
      throw error;
    }
  }, [refreshOwnedCoupons, showToast]);

  const allCouponsDownloaded = useMemo(
    () => COUPON_ITEMS.every((item) => downloadedCouponIds.includes(item.id)),
    [downloadedCouponIds]
  );

  return {
    allCouponsDownloaded,
    downloadCoupon,
    downloadError,
    downloadedCouponIds,
    loadingOwnedCoupons,
    ownedCoupons,
    refreshOwnedCoupons,
  };
}
