import { useCallback, useEffect, useMemo, useState } from 'react';
import { COUPON_ITEMS } from '../data/couponDownloadModal';

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloadedCouponIds));
  }, [downloadedCouponIds]);

  const downloadCoupon = useCallback((id: string) => {
    setDownloadedCouponIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const allCouponsDownloaded = useMemo(
    () => COUPON_ITEMS.every((item) => downloadedCouponIds.includes(item.id)),
    [downloadedCouponIds]
  );

  return { allCouponsDownloaded, downloadCoupon, downloadedCouponIds };
}
