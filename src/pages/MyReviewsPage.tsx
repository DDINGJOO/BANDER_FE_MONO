import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ReviewDeleteConfirmModal } from '../components/reviews/ReviewDeleteConfirmModal';
import { ReviewDeletedToast } from '../components/reviews/ReviewDeletedToast';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  MY_REVIEW_AUTHOR_ICON,
  MY_REVIEWS,
  type MyReview,
  type MyReviewStar,
} from '../data/myReviews';

const STAR_PATH =
  'M25 6.5l5.8 14.4 15.6 1.2-12 10.2 3.7 15.2L25 39.9l-13.1 7.6 3.7-15.2-12-10.2 15.6-1.2L25 6.5z';

function ReviewStar({ variant }: { variant: MyReviewStar }) {
  const rawId = useId();
  const clipId = `my-review-star-half-${rawId.replace(/:/g, '')}`;

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
      <path
        clipPath={`url(#${clipId})`}
        d={STAR_PATH}
        fill="#f6d155"
        stroke="none"
      />
    </svg>
  );
}

function ReviewCard({
  item,
  onRequestDelete,
}: {
  item: MyReview;
  onRequestDelete: (id: string) => void;
}) {
  return (
    <article className="my-review-card">
      <div className="my-review-card__block">
        <div className="my-review-card__meta">
          <div className="my-review-card__author-row">
            <img
              alt=""
              className="my-review-card__avatar"
              src={MY_REVIEW_AUTHOR_ICON}
              width={16}
              height={16}
              loading="lazy"
            />
            <span className="my-review-card__name">{item.authorDisplayName}</span>
            <span className="my-review-card__dot" aria-hidden />
            <span className="my-review-card__date">{item.dateLabel}</span>
          </div>
          {item.deleteAction === 'delete' ? (
            <button
              type="button"
              className="my-review-card__delete"
              onClick={() => onRequestDelete(item.id)}
            >
              삭제
            </button>
          ) : (
            <span className="my-review-card__delete-label">삭제불가</span>
          )}
        </div>
        <div className="my-review-card__body">
          <p className="my-review-card__text">{item.bodyParagraphs[0]}</p>
          <p className="my-review-card__text">{item.bodyParagraphs[1]}</p>
          <div className="my-review-card__stars">
            {item.stars.map((s, i) => (
              <span key={`${item.id}-s${i}`} className="my-review-card__star-wrap">
                <ReviewStar variant={s} />
              </span>
            ))}
            <span className="my-review-card__rating-num">{item.ratingLabel}</span>
          </div>
        </div>
      </div>

      {item.imageUrls.length > 0 ? (
        <div className="my-review-card__photos">
          {item.imageUrls.map((url, i) => (
            <img
              key={`${item.id}-p${i}`}
              alt=""
              className="my-review-card__photo"
              src={url}
              loading="lazy"
            />
          ))}
        </div>
      ) : null}

      <Link className="my-review-card__space" to={item.space.spacePath}>
        <div className="my-review-card__space-inner">
          <img
            alt=""
            className="my-review-card__space-thumb"
            src={item.space.thumbUrl}
            loading="lazy"
          />
          <div className="my-review-card__space-text">
            <p className="my-review-card__space-vendor">{item.space.vendorName}</p>
            <p className="my-review-card__space-title">{item.space.roomTitle}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function MyReviewsPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [reviews, setReviews] = useState<MyReview[]>(() => [...MY_REVIEWS]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteToastOpen, setDeleteToastOpen] = useState(false);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search/map?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerSearchRef.current?.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (!deleteToastOpen) return;
    const t = window.setTimeout(() => setDeleteToastOpen(false), 2800);
    return () => window.clearTimeout(t);
  }, [deleteToastOpen]);

  const closeDeleteModal = () => setDeleteTargetId(null);

  const confirmDeleteReview = () => {
    if (deleteTargetId == null) return;
    setReviews((prev) => prev.filter((r) => r.id !== deleteTargetId));
    setDeleteTargetId(null);
    setDeleteToastOpen(true);
  };

  return (
    <main className="my-reviews-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate('/login')}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() =>
          setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))
        }
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="my-reviews-page__main">
        <div className="my-reviews">
          <div className="my-reviews__head">
            <button
              type="button"
              className="my-reviews__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="my-reviews__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="my-reviews__title">내 리뷰</h1>
          </div>

          <div className="my-reviews__toolbar">
            <p className="my-reviews__count">리뷰 {reviews.length}</p>
            <button type="button" className="my-reviews__sort" aria-haspopup="listbox">
              최신순
              <span className="my-reviews__sort-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="my-reviews__empty">작성한 리뷰가 없습니다.</p>
          ) : (
            <div className="my-reviews__list">
              {reviews.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  onRequestDelete={setDeleteTargetId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <HomeFooter />

      <ReviewDeleteConfirmModal
        open={deleteTargetId != null}
        onCancel={closeDeleteModal}
        onConfirm={confirmDeleteReview}
      />

      <ReviewDeletedToast open={deleteToastOpen} />
    </main>
  );
}
