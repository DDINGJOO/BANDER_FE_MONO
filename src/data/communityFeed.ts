import type { CommunityFeedItemDto } from './schemas/community';

/** 화면용 — 백엔드는 {@link CommunityFeedItemDto} (`thumbnailUrl` 등) */
export type CommunityFeedItem = {
  category: string;
  excerpt: string;
  likes: number;
  /** CSS gradient or image URL — API의 `thumbnailUrl`과 동역할 */
  thumbnail?: string;
  title: string;
  /** 상세 페이지 슬러그 — 있으면 카드가 상세로 연결됨 */
  detailSlug?: string;
};

export function communityFeedItemFromApi(row: CommunityFeedItemDto): CommunityFeedItem {
  return {
    category: row.category,
    excerpt: row.excerpt,
    likes: row.likes,
    thumbnail: row.thumbnailUrl ?? undefined,
    title: row.title,
    detailSlug: row.detailSlug,
  };
}

export function communityFeedItemToApiShape(row: CommunityFeedItem, id?: string): CommunityFeedItemDto {
  return {
    id,
    category: row.category,
    excerpt: row.excerpt,
    likes: row.likes,
    thumbnailUrl: row.thumbnail ?? null,
    title: row.title,
    detailSlug: row.detailSlug,
  };
}

/** 데모 피드 — 검색 커뮤니티 탭과 동일 소스 */
export const COMMUNITY_FEED_ITEMS: CommunityFeedItem[] = [
  {
    category: '궁금해요',
    excerpt:
      '입문자인데 라이브 공연까지 쓸 수 있는 무난한 보드 찾고 있어요. 가성비 좋은 브랜드 있으면 추천해주세요!',
    likes: 189,
    thumbnail: 'https://www.figma.com/api/mcp/asset/433731a6-2d90-4fef-a5f7-508beb4e3508',
    title: '보컬용 이펙터 추천 좀 해주세요!',
    detailSlug: 'vocal-effector-help',
  },
  {
    category: '정보공유',
    excerpt:
      '20평 규모 복층형 사운드랩 한층 형태 공간이지만, 다른 공간과 공간은 완전히 분리되어있고, 야간 할인 카드로 있어서 시간대 별로 저렴하게 가능해요!',
    likes: 4,
    thumbnail: 'linear-gradient(135deg, #80aab4, #d4861f)',
    title: '서울 지역 연습실습실 가격 비교 정리했습니다 🎵',
  },
  {
    category: '공간리뷰',
    excerpt:
      '인테리어도 만족스러웠고 음향 구성도 잘 되어 있었습니다. 직접 보고 느낀 상세한 관리가 잘 되어 있어서 장비 컨디션도 좋게 느꼈어요.',
    likes: 5,
    thumbnail: 'linear-gradient(135deg, #1b2f5d, #07131f)',
    title: '홍대 합주실 예약 후기 - 가성비 괜찮은 편입니다',
  },
  {
    category: '공간문의',
    excerpt:
      '최근 공간 기본 사양 표기에 관심이 생겨서 이것저것 알아보고 있습니다. 특히 공조와 음향 관련해 모델명까지 다 나온 곳들도 종종 있더라고요.',
    likes: 2,
    title: '공간 임대/프린트 출력 있으면 본 계신가요?',
  },
  {
    category: '정보공유',
    excerpt: '소규모 밴드 기준으로 레슨실 겸 합주 가능한 공간 조건을 정리해 봤습니다.',
    likes: 12,
    thumbnail: 'linear-gradient(135deg, #4a6fa5, #2d3e50)',
    title: '강남·신촌 연습실 월 대관 비교 (2026 기준)',
  },
  {
    category: '모집',
    excerpt: '주 1회 저녁 합주 팀에서 베이스 한 분 구합니다. 장르는 얼터너티브 쪽입니다.',
    likes: 7,
    thumbnail: 'linear-gradient(135deg, #8b5a3c, #3d2914)',
    title: '[모집] 수요일 밤 합주 멤버 베이스 구해요',
  },
  {
    category: '공간리뷰',
    excerpt: '방음이랑 에어컨 소음 정도, 콘센트 위치까지 적어두었어요.',
    likes: 3,
    title: '신림 소형 룸 이용 후기 (사진 많음)',
  },
];

export const COMMUNITY_SORT_OPTIONS = [
  '최신순',
  '인기순',
  '정확도순',
  '댓글 많은 순',
  '좋아요 많은 순',
] as const;

/** 목록 상단 칩 필터용 — 전체 + 피드에 등장하는 카테고리 */
export function getCommunityCategoryFilters(items: CommunityFeedItem[]): string[] {
  const seen = new Set<string>();
  for (const row of items) seen.add(row.category);
  return ['전체', ...Array.from(seen).sort((a, b) => a.localeCompare(b, 'ko'))];
}
