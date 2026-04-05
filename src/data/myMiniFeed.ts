/** Figma 6150:32102 · 작성한 글 / Figma 6419:81316 · 댓글단 글 (목록 5개 동일 데모) */

import type { UserMiniFeedProfileDto, UserMiniFeedPostDto } from './schemas/miniFeed';

export const MINI_FEED_PROFILE_AVATAR =
  'https://www.figma.com/api/mcp/asset/c715c30c-19cb-4f9f-8184-ea1786d2afe2';

export const MINI_FEED_AUTHOR_AVATAR_SMALL =
  'https://www.figma.com/api/mcp/asset/8a18db3c-eb3a-4ac5-8165-d96c0542c32d';

export const MINI_FEED_THUMB_1 =
  'https://www.figma.com/api/mcp/asset/cea19563-2012-47ab-bf61-1df8a8e25fa6';

export const MINI_FEED_THUMB_2 =
  'https://www.figma.com/api/mcp/asset/4ff1d502-fa6b-464e-8c3e-449cb49d7a2b';

/** 피드 카드 — {@link UserMiniFeedPostDto}와 동일 필드 (미니피드 전용 `excerptLines` 포함) */
export type MiniFeedPost = UserMiniFeedPostDto & { excerptLines: string[] };

export const MINI_FEED_PROFILE: UserMiniFeedProfileDto = {
  userId: 'demo-user-minifeed',
  bio: '안녕하세요 뮤지션J 입니다.',
  joinLabel: '23.02 가입',
  nickname: '뮤지션J',
  profileImageUrl: MINI_FEED_PROFILE_AVATAR,
  tags: ['#록/메탈', '#밴드', '#피아노', '#기타'],
};

export const MINI_FEED_SORT_OPTIONS = ['최신순', '인기순', '댓글 많은 순'] as const;

/** 탭: 작성한 글 */
export const MINI_FEED_WRITTEN_POSTS: MiniFeedPost[] = [
  {
    excerpt:
      '20명 규모 행사 진행했는데 음향 상태 좋고 의자도 편했습니다. 다만 주차 공간은 협소해서 대중교통 추천드려요.',
    category: '꿀팁공유',
    title: '서울 지역 댄스연습실 가격 비교 정리했습니다 📊',
    excerptLines: [
      '20명 규모 행사 진행했는데 음향 상태 좋고 의자도 편했습니다.',
      '다만 주차 공간은 협소해서 대중교통 추천드려요. 야간 할인 있는 곳도 있어서 시간대 잘 보면 저렴하게 가능해요!',
    ],
    thumbnail: MINI_FEED_THUMB_1,
    authorAvatar: MINI_FEED_AUTHOR_AVATAR_SMALL,
    authorName: 'neowmeow',
    timeLabel: '방금',
    likes: 4,
    comments: 2,
    detailSlug: 'vocal-effector-help',
  },
  {
    excerpt:
      '이번에 밴드 연습 때문에 홍대 쪽 합주실을 처음 이용해봤습니다. 전체적으로 공간은 생각보다 넓었고, 방음도 준수한 편이었어요.',
    category: '공간리뷰',
    title: '홍대 합주실 이용 후기 – 가성비 괜찮은 편입니다',
    excerptLines: [
      '이번에 밴드 연습 때문에 홍대 쪽 합주실을 처음 이용해봤습니다.',
      '전체적으로 공간은 생각보다 넓었고, 방음도 준수한 편이었어요. 드럼, 앰프 상태도 관리가 잘 되어 있어서 장비 때문에 스트레스 받지는 않았습니다.',
    ],
    thumbnail: MINI_FEED_THUMB_2,
    authorAvatar: MINI_FEED_AUTHOR_AVATAR_SMALL,
    authorName: 'neowmeow',
    timeLabel: '5분 전',
    likes: 5,
    comments: 1,
  },
  {
    excerpt:
      '최근 공간 기반 사업 모델에 관심이 생겨서 이것저것 알아보고 있습니다. 특히 소규모 상업 공간을 리모델링해서 단기 대관 모델로 운영하는 방식에 관심이 있어요.',
    category: '궁금해요',
    title: '공간 임대/프롭테크 관심 있으신 분 계신가요? 🏢',
    excerptLines: [
      '최근 공간 기반 사업 모델에 관심이 생겨서 이것저것 알아보고 있습니다.',
      '특히 소규모 상업 공간을 리모델링해서 단기 대관 모델로 운영하는 방식에 관심이 있어요.',
    ],
    authorAvatar: MINI_FEED_AUTHOR_AVATAR_SMALL,
    authorName: 'neowmeow',
    timeLabel: '5분 전',
    likes: 2,
    comments: 5,
  },
  {
    excerpt:
      '공간 임대 사업을 준비하면서 가장 크게 느낀 건, 단순히 “공간이 좋다”만으로는 부족하다는 점이었습니다. 정기 대관 고객 확보가 중요해요.',
    category: '꿀팁공유',
    title: '공간 창업 준비하면서 느낀 현실적인 부분 공유합니다',
    excerptLines: [
      '공간 임대 사업을 준비하면서 가장 크게 느낀 건, 단순히 “공간이 좋다”만으로는 부족하다는 점이었습니다. 특히 반복 매출 구조를 어떻게 만들 것인지가 중요하더라고요.',
      '정기 대관 고객을 확보하지 못하면 매출 변동성이 커집니다.',
    ],
    authorAvatar: MINI_FEED_AUTHOR_AVATAR_SMALL,
    authorName: 'neowmeow',
    timeLabel: '6분 전',
    likes: 1,
    comments: 8,
  },
  {
    excerpt:
      '최근 제조 파트너사 공장을 방문했는데, 자동화 수준이 생각보다 높았습니다. 장기 납품 계약이 있는 구조라 생산 계획이 예측 가능했어요.',
    category: '꿀팁공유',
    title: '스마트팩토리 견학 다녀온 후기 공유합니다',
    excerptLines: [
      '최근 제조 파트너사 공장을 방문했는데, 자동화 수준이 생각보다 높았습니다.',
      '특히 장기 납품 계약이 있는 구조라 생산 계획이 예측 가능하다는 점이 안정적으로 느껴졌습니다.',
    ],
    authorAvatar: MINI_FEED_AUTHOR_AVATAR_SMALL,
    authorName: 'neowmeow',
    timeLabel: '8분 전',
    likes: 7,
    comments: 11,
  },
];

/** 탭: 댓글단 글 — Figma에서 작성한 글과 동일 5카드 구성 */
export const MINI_FEED_COMMENTED_POSTS: MiniFeedPost[] = MINI_FEED_WRITTEN_POSTS.map((p) => ({
  ...p,
}));
