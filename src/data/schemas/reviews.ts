/**
 * UC-11 리뷰
 * @see docs/BACKEND_API.md §10
 */

import type { ApiOffsetPageDto } from './common';

/** POST /api/v1/reviews */
export type CreateReviewRequestDto = {
  reservationId: string;
  rating: number;
  text: string;
  imageRefs: string[];
};

export type CreateReviewResponseDto = {
  reviewId: string;
};

export type MyReviewStarDto = 'full' | 'half' | 'empty';

/** GET /api/v1/users/me/reviews 한 행 (UI MyReview과 1:1에 가깝게) */
export type MyReviewListItemDto = {
  id: string;
  authorDisplayName: string;
  dateLabel: string;
  bodyParagraphs: string[];
  stars: [MyReviewStarDto, MyReviewStarDto, MyReviewStarDto, MyReviewStarDto, MyReviewStarDto];
  ratingLabel: string;
  imageUrls: string[];
  space: {
    vendorName: string;
    roomTitle: string;
    thumbUrl: string;
    spacePath: string;
  };
  deleteAction: 'delete' | 'disabled';
};

export type MyReviewsPageResponseDto = ApiOffsetPageDto<MyReviewListItemDto>;

/** GET /api/v1/reviews/{id} */
export type ReviewDetailResponseDto = {
  id: string;
  reservationId?: string;
  rating: number;
  text: string;
  imageUrls: string[];
  authorDisplayName: string;
  createdAt: string;
  deletedAt?: string | null;
};
