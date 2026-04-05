/**
 * Figma 6419:81164 — 내 리뷰
 * 목록 API: {@link import('./schemas/reviews').MyReviewListItemDto} — GET /api/v1/users/me/reviews
 */

import type { MyReviewListItemDto } from './schemas/reviews';

export type MyReviewStar = MyReviewListItemDto['stars'][number];

export type MyReviewDeleteAction = 'delete' | 'disabled';

export type MyReview = Omit<MyReviewListItemDto, 'bodyParagraphs' | 'stars'> & {
  bodyParagraphs: [string, string];
  stars: [MyReviewStar, MyReviewStar, MyReviewStar, MyReviewStar, MyReviewStar];
};

function review(
  row: Omit<MyReview, 'deleteAction'> & { deleteAction?: MyReviewDeleteAction },
): MyReview {
  return { ...row, deleteAction: row.deleteAction ?? 'delete' };
}

/** 리뷰 카드 상단 프로필 자리 아이콘 (Figma image 16×16) */
export const MY_REVIEW_AUTHOR_ICON =
  'https://www.figma.com/api/mcp/asset/e67d2886-a49d-4cbf-8cce-8625f14a725f';

export const MY_REVIEWS: MyReview[] = [
  review({
    id: 'mr1',
    authorDisplayName: '뮤지션J',
    dateLabel: '25.08.22',
    bodyParagraphs: [
      '합주실이 넓고 쾌적했어요. 특히 드럼 세트가 상태가 좋고, 방음도 잘 돼서 마음껏 연습할 수 있었습니다. 예약도 간편하고, 가격도 괜찮아요.',
      '다만 주차 공간이 조금 부족한 점은 아쉬웠어요.',
    ],
    stars: ['full', 'full', 'full', 'full', 'half'],
    ratingLabel: '4.5',
    imageUrls: [
      'https://www.figma.com/api/mcp/asset/6878b33c-3f0e-4cd2-b6b3-8812bdcc974f',
      'https://www.figma.com/api/mcp/asset/39b92eb5-dfff-4099-ae41-1b805450bf9e',
    ],
    space: {
      vendorName: '유스뮤직',
      roomTitle: 'A룸 그랜드 피아노 대관',
      thumbUrl:
        'https://www.figma.com/api/mcp/asset/6878b07b-b7d0-4817-be61-af5342b90354',
      spacePath: '/spaces/a-room-grand-piano-rental',
    },
  }),
  review({
    id: 'mr2',
    authorDisplayName: '뮤지션J',
    dateLabel: '25.08.22',
    bodyParagraphs: [
      '시설 상태가 정말 훌륭합니다. 음향 장비와 PA 시스템도 최신 모델이라 깔끔하게 소리가 잘 나고, 스튜디오 분위기도 너무 좋았어요.',
      '예약할 때 응답도 빠르고 친절해서 만족스러웠습니다. 자주 이용할 것 같아요!',
    ],
    stars: ['full', 'full', 'full', 'full', 'half'],
    ratingLabel: '4.5',
    imageUrls: [
      'https://www.figma.com/api/mcp/asset/402aabff-69ef-4b45-88d2-d683f571e169',
    ],
    space: {
      vendorName: '유스뮤직',
      roomTitle: 'B룸 그랜드 피아노 대관',
      thumbUrl:
        'https://www.figma.com/api/mcp/asset/ec854a23-681e-4a58-ac51-1450ee21d439',
      spacePath: '/spaces/room-b-u1',
    },
  }),
  review({
    id: 'mr3',
    authorDisplayName: '뮤지션J',
    dateLabel: '25.08.22',
    bodyParagraphs: [
      '합주실이 꽤 넓고 장비 상태는 좋았지만, 시설 관리가 조금 부족한 것 같아요. 특히 에어컨이 잘 안 효율적으로 작동해서 더운 날에는 불편할 수 있었습니다.',
      '그래도 가격 대비 괜찮은 선택입니다.',
    ],
    stars: ['full', 'full', 'full', 'full', 'half'],
    ratingLabel: '4.5',
    imageUrls: [],
    space: {
      vendorName: '플레이그라운드뮤직',
      roomTitle: 'A룸 그랜드 피아노 대관',
      thumbUrl:
        'https://www.figma.com/api/mcp/asset/6878b07b-b7d0-4817-be61-af5342b90354',
      spacePath: '/spaces/a-room-grand-piano-rental',
    },
    deleteAction: 'disabled',
  }),
];
