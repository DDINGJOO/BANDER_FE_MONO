/**
 * Figma 6419:80683 — 내가 쓴 리뷰보기 모달
 */

import type { MyReviewStar } from './myReviews';

export type ReviewViewModalModel = {
  /** 상단 노란 테두리 박스 (예: 업체/요약 별점) */
  highlightRatingLabel: string;
  highlightFullStars: number;
  authorDisplayName: string;
  dateLabel: string;
  bodyText: string;
  detailStars: [MyReviewStar, MyReviewStar, MyReviewStar, MyReviewStar, MyReviewStar];
  detailRatingLabel: string;
  imageUrls: string[];
  authorIconUrl: string;
  space: {
    vendorName: string;
    roomTitle: string;
    thumbUrl: string;
    spacePath: string;
  };
};

export const REVIEW_VIEW_MODAL_DEFAULT: ReviewViewModalModel = {
  highlightRatingLabel: '5.0',
  highlightFullStars: 5,
  authorDisplayName: '뮤지션J',
  dateLabel: '25.08.22',
  bodyText:
    '합주실이 넓고 쾌적했어요. 특히 드럼 세트가 상태가 좋고, 방음도 잘 돼서 마음껏 연습할 수 있었습니다. 예약도 간편하고, 가격도 괜찮아요. 다만 주차 공간이 조금 부족한 점은 아쉬웠어요.',
  detailStars: ['full', 'full', 'full', 'full', 'half'],
  detailRatingLabel: '4.5',
  imageUrls: [
    'https://www.figma.com/api/mcp/asset/8cb641e9-655a-40ec-9447-ab631cb17b28',
    'https://www.figma.com/api/mcp/asset/9ff9fed7-2a36-4bcc-9049-baceab550d4a',
  ],
  authorIconUrl:
    'https://www.figma.com/api/mcp/asset/93bdd87f-63b0-48d1-9f96-b2a1afd09bc7',
  space: {
    vendorName: '유스뮤직',
    roomTitle: 'A룸 그랜드 피아노 대관',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/4a578ad0-2a2c-4232-9ef7-6b9b53a3a66e',
    spacePath: '/spaces/a-room-grand-piano-rental',
  },
};
