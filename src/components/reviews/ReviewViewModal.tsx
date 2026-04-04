import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { ReviewViewModalModel } from '../../data/reviewViewModal';
import type { MyReviewStar } from '../../data/myReviews';

const STAR_PATH =
  'M25 6.5l5.8 14.4 15.6 1.2-12 10.2 3.7 15.2L25 39.9l-13.1 7.6 3.7-15.2-12-10.2 15.6-1.2L25 6.5z';

function Star24Full() {
  return (
    <svg width="24" height="24" viewBox="0 0 50 50" aria-hidden="true">
      <path
        d={STAR_PATH}
        fill="#f6d155"
        stroke="#f6d155"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function DetailStar({ variant }: { variant: MyReviewStar }) {
  const rawId = useId();
  const clipId = `review-view-star-half-${rawId.replace(/:/g, '')}`;

  if (variant === 'full') {
    return (
      <svg width="14" height="14" viewBox="0 0 50 50" aria-hidden="true">
        <path
          d={STAR_PATH}
          fill="#f6d155"
          stroke="#f6d155"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (variant === 'empty') {
    return (
      <svg width="14" height="14" viewBox="0 0 50 50" aria-hidden="true">
        <path
          d={STAR_PATH}
          fill="none"
          stroke="#c4c9d4"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 50 50" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect height="50" width="25" x="0" y="0" />
        </clipPath>
      </defs>
      <path
        d={STAR_PATH}
        fill="none"
        stroke="#c4c9d4"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path clipPath={`url(#${clipId})`} d={STAR_PATH} fill="#f6d155" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export type ReviewViewModalProps = {
  content: ReviewViewModalModel;
  onClose: () => void;
  open: boolean;
};

/** Figma 6419:80683 — 내가 쓴 리뷰보기 */
export function ReviewViewModal({ content, onClose, open }: ReviewViewModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const n = Math.min(5, Math.max(0, Math.floor(content.highlightFullStars)));

  return createPortal(
    <div className="review-view-modal">
      <button
        aria-label="닫기"
        className="review-view-modal__backdrop"
        onClick={onClose}
        type="button"
      />
      <div
        className="review-view-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-view-modal-title"
      >
        <div className="review-view-modal__header">
          <h2 className="review-view-modal__title" id="review-view-modal-title">
            내가 쓴 리뷰보기
          </h2>
          <button
            type="button"
            className="review-view-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="review-view-modal__body">
          <div className="review-view-modal__highlight">
            <div className="review-view-modal__highlight-stars">
              {Array.from({ length: n }, (_, i) => (
                <Star24Full key={`h-${i}`} />
              ))}
            </div>
            <p className="review-view-modal__highlight-score">{content.highlightRatingLabel}</p>
          </div>

          <div className="review-view-modal__block">
            <div className="review-view-modal__author-row">
              <img
                alt=""
                className="review-view-modal__avatar"
                src={content.authorIconUrl}
                width={16}
                height={16}
                loading="lazy"
              />
              <span className="review-view-modal__name">{content.authorDisplayName}</span>
              <span className="review-view-modal__dot" aria-hidden />
              <span className="review-view-modal__date">{content.dateLabel}</span>
            </div>
            <div className="review-view-modal__review-main">
              <p className="review-view-modal__text">{content.bodyText}</p>
              <div className="review-view-modal__detail-stars">
                {content.detailStars.map((s, i) => (
                  <span key={`d-${i}`} className="review-view-modal__star-wrap">
                    <DetailStar variant={s} />
                  </span>
                ))}
                <span className="review-view-modal__detail-score">{content.detailRatingLabel}</span>
              </div>
            </div>
          </div>

          {content.imageUrls.length > 0 ? (
            <div className="review-view-modal__photos">
              {content.imageUrls.map((url, i) => (
                <img
                  key={`p-${i}`}
                  alt=""
                  className="review-view-modal__photo"
                  src={url}
                  loading="lazy"
                />
              ))}
            </div>
          ) : null}

          <Link className="review-view-modal__space" to={content.space.spacePath} onClick={onClose}>
            <div className="review-view-modal__space-inner">
              <img
                alt=""
                className="review-view-modal__space-thumb"
                src={content.space.thumbUrl}
                loading="lazy"
              />
              <div className="review-view-modal__space-text">
                <p className="review-view-modal__space-vendor">{content.space.vendorName}</p>
                <p className="review-view-modal__space-title">{content.space.roomTitle}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
