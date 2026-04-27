import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { COUPON_ITEMS, COUPON_USAGE_ROOMS, type CouponDownloadItem } from '../../data/couponDownloadModal';
import type { CouponAvailableItemDto } from '../../data/schemas/coupon';
import { ChevronIcon } from '../shared/Icons';

function CouponModalCloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function CouponDownloadGlyph() {
  return (
    <svg aria-hidden="true" className="space-reservation__coupon-dl-svg" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v9m0 0l3.25-3.25M12 14L8.75 10.75M7 17.5h10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function CouponCheckGlyph() {
  return (
    <svg aria-hidden="true" className="space-reservation__coupon-check-svg" fill="none" viewBox="0 0 24 24">
      <path
        d="M6.5 12.2l3.2 3.2L17.5 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

type CouponDownloadModalProps = {
  coupons?: CouponAvailableItemDto[];
  downloadedCouponIds: string[];
  errorMessage?: string | null;
  loading?: boolean;
  onClose: () => void;
  onDownloadCoupon: (id: string) => void | Promise<void>;
  onSelectCoupon?: (id: string) => void;
  open: boolean;
  selectable?: boolean;
  selectedCouponId?: string | null;
  title?: string;
};

function toCouponViewItem(coupon: CouponAvailableItemDto): CouponDownloadItem {
  return {
    id: coupon.id,
    metaNote: null,
    subtitle: coupon.title,
    terms: coupon.validUntilLabel ? [`기한 : ${coupon.validUntilLabel}까지`] : [],
    usageSummary: coupon.spaceSlug ? '사용가능 : 현재 선택한 룸' : null,
    valueMain: coupon.discountLabel,
  };
}

export function CouponDownloadModal({
  coupons,
  downloadedCouponIds,
  errorMessage,
  loading = false,
  onClose,
  onDownloadCoupon,
  onSelectCoupon,
  open,
  selectable = false,
  selectedCouponId = null,
  title,
}: CouponDownloadModalProps) {
  const [usageRoomsOpen, setUsageRoomsOpen] = useState(false);
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const couponItems = coupons ? coupons.map(toCouponViewItem) : COUPON_ITEMS;
  const modalTitle = title ?? `적용 가능 쿠폰 ${couponItems.length}`;

  useEffect(() => {
    if (!open) {
      setUsageRoomsOpen(false);
    }
  }, [open]);

  if (!open || !modalRoot) {
    return null;
  }

  return createPortal(
    <div className="space-reservation__modal">
      <div aria-hidden="true" className="space-reservation__modal-backdrop" onClick={onClose} />
      <div
        className="space-reservation__modal-dialog space-reservation__modal-dialog--coupon"
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-download-modal-title"
      >
        <div className="space-reservation__coupon-modal-header">
          <h2 id="coupon-download-modal-title">{modalTitle}</h2>
          <button aria-label="닫기" className="space-reservation__coupon-modal-close" onClick={onClose} type="button">
            <CouponModalCloseIcon />
          </button>
        </div>
        <div className="space-reservation__coupon-list">
          {loading ? <p className="space-reservation__coupon-state">쿠폰을 불러오는 중입니다.</p> : null}
          {!loading && errorMessage ? <p className="space-reservation__coupon-state">{errorMessage}</p> : null}
          {!loading && !errorMessage && couponItems.length === 0 ? (
            <p className="space-reservation__coupon-state">다운로드 가능한 쿠폰이 없습니다.</p>
          ) : null}
          {!loading && !errorMessage ? couponItems.map((coupon) => {
            const downloaded = downloadedCouponIds.includes(coupon.id);
            const selected = selectedCouponId === coupon.id;
            const actionDone = selectable ? selected : downloaded;
            const actionLabel = selectable
              ? selected
                ? `${coupon.valueMain} 할인 쿠폰 적용됨`
                : downloaded
                  ? `${coupon.valueMain} 할인 쿠폰 적용`
                  : `${coupon.valueMain} 할인 쿠폰 다운로드`
              : downloaded
                ? `${coupon.valueMain} 할인 쿠폰 다운로드 완료`
                : `${coupon.valueMain} 할인 쿠폰 다운로드`;

            return (
              <div className="space-reservation__coupon-card" key={coupon.id}>
                <div className="space-reservation__coupon-card-main">
                  <div className="space-reservation__coupon-card-head">
                    <p className="space-reservation__coupon-subtitle">{coupon.subtitle}</p>
                    <div className="space-reservation__coupon-value-row">
                      <span className="space-reservation__coupon-value-main">{coupon.valueMain}</span>
                      <span className="space-reservation__coupon-value-suffix">할인</span>
                    </div>
                    {coupon.metaNote ? <p className="space-reservation__coupon-meta-note">{coupon.metaNote}</p> : null}
                  </div>
                  <div className="space-reservation__coupon-terms">
                    {coupon.usageSummary ? (
                      <div className="space-reservation__coupon-term-row-wrap">
                        <button
                          className="space-reservation__coupon-usage-toggle"
                          onClick={(event) => {
                            event.stopPropagation();
                            setUsageRoomsOpen((v) => !v);
                          }}
                          type="button"
                        >
                          <span className="space-reservation__coupon-term-dot" aria-hidden="true" />
                          <span className="space-reservation__coupon-usage-label">{coupon.usageSummary}</span>
                          <span
                            className={`space-reservation__coupon-usage-chevron ${usageRoomsOpen ? 'space-reservation__coupon-usage-chevron--open' : ''}`}
                            aria-hidden="true"
                          >
                            <ChevronIcon />
                          </span>
                        </button>
                        {usageRoomsOpen && coupon.id === 'coupon-3000' ? (
                          <div className="space-reservation__coupon-rooms-popover" role="region" aria-label="사용가능 룸">
                            <p className="space-reservation__coupon-rooms-popover-title">사용가능 룸</p>
                            <ul className="space-reservation__coupon-rooms-popover-list">
                              {COUPON_USAGE_ROOMS.map((room) => (
                                <li className="space-reservation__coupon-rooms-popover-item" key={room}>
                                  <span className="space-reservation__coupon-term-dot" aria-hidden="true" />
                                  <span>{room}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {coupon.terms.map((term) => (
                      <div className="space-reservation__coupon-term-row" key={term}>
                        <span className="space-reservation__coupon-term-dot" aria-hidden="true" />
                        <p>{term}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  aria-label={actionLabel}
                  className={`space-reservation__coupon-action ${actionDone ? 'space-reservation__coupon-action--done' : ''}`}
                  onClick={() => {
                    if (selectable && downloaded) {
                      onSelectCoupon?.(coupon.id);
                      return;
                    }
                    void Promise.resolve(onDownloadCoupon(coupon.id)).then(() => {
                      if (selectable) {
                        onSelectCoupon?.(coupon.id);
                      }
                    }).catch(() => undefined);
                  }}
                  type="button"
                >
                  {actionDone || downloaded ? <CouponCheckGlyph /> : <CouponDownloadGlyph />}
                </button>
              </div>
            );
          }) : null}
        </div>
        <div className="space-reservation__coupon-modal-footer">
          <button className="space-reservation__coupon-footer-btn" onClick={onClose} type="button">
            확인
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
