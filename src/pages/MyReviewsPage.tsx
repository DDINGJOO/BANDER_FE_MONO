import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteReview,
  getBookingDetail,
  getMyReviews,
  type BookingDetailResponse,
  type ReviewResponse,
} from '../api/bookings';
import { ApiError } from '../api/client';
import { getMySummary, type UserMeSummary } from '../api/users';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ReviewDeleteConfirmModal } from '../components/reviews/ReviewDeleteConfirmModal';
import { ReviewDeletedToast } from '../components/reviews/ReviewDeletedToast';
import { ChevronIcon } from '../components/shared/Icons';
import { DEFAULT_PROFILE_IMAGE_URL, resolveProfileImageUrl } from '../config/media';
import { getCdnBaseUrl } from '../config/publicEnv';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';

const STAR_PATH =
  'M25 6.5l5.8 14.4 15.6 1.2-12 10.2 3.7 15.2L25 39.9l-13.1 7.6 3.7-15.2-12-10.2 15.6-1.2L25 6.5z';

const PAGE_SIZE = 100;
const UUID_REF_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

type MyReviewStar = 'full' | 'half' | 'empty';

type MyReview = {
  id: string;
  authorDisplayName: string;
  authorAvatarUrl: string;
  dateLabel: string;
  bodyParagraphs: string[];
  stars: [MyReviewStar, MyReviewStar, MyReviewStar, MyReviewStar, MyReviewStar];
  ratingLabel: string;
  imageUrls: string[];
  space: {
    vendorName: string;
    roomTitle: string;
    thumbUrl: string | null;
    spacePath: string;
  };
  deleteAction: 'delete' | 'disabled';
};

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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) {
    return error.status > 0 ? `${error.message} (${error.status})` : error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function formatDateLabel(value: string | null | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${match[1].slice(2)}.${match[2]}.${match[3]}`;
}

function toStars(rating: number): MyReview['stars'] {
  const normalized = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));
  return [0, 1, 2, 3, 4].map((index) => {
    const value = normalized - index;
    if (value >= 1) return 'full';
    if (value >= 0.5) return 'half';
    return 'empty';
  }) as MyReview['stars'];
}

function toRatingLabel(rating: number) {
  const normalized = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));
  return normalized.toFixed(1);
}

function toParagraphs(content: string) {
  const paragraphs = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs : ['작성된 리뷰 내용이 없습니다.'];
}

function resolveReviewImageUrl(ref: string) {
  const trimmed = ref.trim();
  if (!trimmed || UUID_REF_PATTERN.test(trimmed)) {
    return null;
  }
  if (
    trimmed.startsWith('http') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const cdn = getCdnBaseUrl();
  return cdn ? `${cdn}/${trimmed.replace(/^\//, '')}` : null;
}

function imageRefsToUrls(imageRefs: string[] | null | undefined) {
  return (imageRefs ?? [])
    .map(resolveReviewImageUrl)
    .filter((url): url is string => Boolean(url));
}

function toReviewCard(
  review: ReviewResponse,
  booking: BookingDetailResponse | null,
  summary: UserMeSummary | null,
): MyReview {
  const authorDisplayName = summary?.displayName?.trim() || '내 리뷰';
  const authorAvatarUrl = resolveProfileImageUrl(
    summary?.profileImageRef ?? null,
    summary?.profileImageUrl ?? null,
  ) || DEFAULT_PROFILE_IMAGE_URL;
  const bookingId = review.bookingId?.trim();
  const vendorName = booking?.studioName?.trim() || '공간 정보';
  const roomTitle = booking?.roomName?.trim() || '리뷰한 공간';

  return {
    id: review.reviewId,
    authorDisplayName,
    authorAvatarUrl,
    dateLabel: formatDateLabel(review.createdAt),
    bodyParagraphs: toParagraphs(review.content),
    stars: toStars(review.rating),
    ratingLabel: toRatingLabel(review.rating),
    imageUrls: imageRefsToUrls(review.imageRefs),
    space: {
      vendorName,
      roomTitle,
      thumbUrl: booking?.studioThumbnailUrl?.trim() || null,
      spacePath: bookingId
        ? `/reservation-detail?bookingId=${encodeURIComponent(bookingId)}`
        : '/my-reservations?tab=past',
    },
    deleteAction: 'delete',
  };
}

function SpaceThumb({ item }: { item: MyReview }) {
  if (item.space.thumbUrl) {
    return (
      <img
        alt=""
        className="my-review-card__space-thumb"
        src={item.space.thumbUrl}
        loading="lazy"
      />
    );
  }

  const initial = item.space.vendorName.trim().charAt(0) || 'B';
  return (
    <span
      aria-hidden="true"
      className="my-review-card__space-thumb my-review-card__space-thumb--placeholder"
    >
      {initial}
    </span>
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
              src={item.authorAvatarUrl}
              width={16}
              height={16}
              loading="lazy"
            />
            <span className="my-review-card__name">{item.authorDisplayName}</span>
            {item.dateLabel ? (
              <>
                <span className="my-review-card__dot" aria-hidden />
                <span className="my-review-card__date">{item.dateLabel}</span>
              </>
            ) : null}
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
          {item.bodyParagraphs.map((paragraph, index) => (
            <p key={`${item.id}-body-${index}`} className="my-review-card__text">
              {paragraph}
            </p>
          ))}
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
          <SpaceThumb item={item} />
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
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(isAuthenticated);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteToastOpen, setDeleteToastOpen] = useState(false);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
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
    let cancelled = false;

    if (!isAuthenticated) {
      setLoading(false);
      setReviews([]);
      setTotalCount(0);
      setErrorMessage(null);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setErrorMessage(null);

    async function loadReviews() {
      try {
        const [page, summary] = await Promise.all([
          getMyReviews({ size: PAGE_SIZE }),
          getMySummary().catch(() => null),
        ]);
        const enriched = await Promise.all(
          page.items.map(async (review) => {
            const booking = review.bookingId
              ? await getBookingDetail(review.bookingId).catch(() => null)
              : null;
            return toReviewCard(review, booking, summary);
          }),
        );

        if (cancelled) return;
        setReviews(enriched);
        setTotalCount(page.totalCount ?? enriched.length);
      } catch (error) {
        if (cancelled) return;
        setReviews([]);
        setTotalCount(0);
        setErrorMessage(getErrorMessage(error, '리뷰를 불러오지 못했습니다.'));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!deleteToastOpen) return;
    const t = window.setTimeout(() => setDeleteToastOpen(false), 2800);
    return () => window.clearTimeout(t);
  }, [deleteToastOpen]);

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteTargetId(null);
  };

  const confirmDeleteReview = async () => {
    if (deleteTargetId == null || deletingId != null) return;
    const targetId = deleteTargetId;
    setDeletingId(targetId);
    setErrorMessage(null);

    try {
      await deleteReview(targetId);
      setReviews((prev) => prev.filter((r) => r.id !== targetId));
      setTotalCount((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
      setDeleteTargetId(null);
      setDeleteToastOpen(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '리뷰 삭제에 실패했습니다.'));
    } finally {
      setDeletingId(null);
    }
  };

  const emptyMessage = isAuthenticated
    ? '작성한 리뷰가 없습니다.'
    : '로그인 후 작성한 리뷰를 확인할 수 있습니다.';
  const displayedCount = totalCount ?? reviews.length;

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
            <p className="my-reviews__count">리뷰 {displayedCount}</p>
            <button type="button" className="my-reviews__sort" aria-haspopup="listbox">
              최신순
              <span className="my-reviews__sort-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
          </div>

          {errorMessage ? (
            <p className="my-reviews__state my-reviews__state--error">{errorMessage}</p>
          ) : null}

          {loading ? (
            <p className="my-reviews__state">리뷰를 불러오는 중입니다.</p>
          ) : reviews.length === 0 && !errorMessage ? (
            <p className="my-reviews__empty">{emptyMessage}</p>
          ) : reviews.length > 0 ? (
            <div className="my-reviews__list">
              {reviews.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  onRequestDelete={setDeleteTargetId}
                />
              ))}
            </div>
          ) : null}
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
