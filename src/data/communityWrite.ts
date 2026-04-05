import type {
  CommunityWriteMetaResponseDto,
  CreateCommunityPostRequestDto,
} from './schemas/community';

/** Figma 커뮤니티_글쓰기 — 카테고리 (피드 카테고리와 동일 계열) */
export const COMMUNITY_WRITE_CATEGORIES = [
  '궁금해요',
  '정보공유',
  '공간리뷰',
  '공간문의',
  '모집',
] as const;

export type CommunityWriteCategory = (typeof COMMUNITY_WRITE_CATEGORIES)[number];

/** 주제 선택 */
export const COMMUNITY_WRITE_TOPICS = [
  '일반',
  '질문',
  '후기',
  '정보',
  '모집',
] as const;

export type CommunityWriteTopic = (typeof COMMUNITY_WRITE_TOPICS)[number];

export const COMMUNITY_WRITE_BODY_MAX = 80;
export const COMMUNITY_WRITE_TITLE_MAX = 60;
export const COMMUNITY_WRITE_PHOTO_MAX = 5;

/** GET /api/v1/meta/community-write 형태로 내려줄 수 있는 묶음 */
export function getCommunityWriteMetaDto(): CommunityWriteMetaResponseDto {
  return {
    categories: [...COMMUNITY_WRITE_CATEGORIES],
    topics: [...COMMUNITY_WRITE_TOPICS],
    bodyMaxLength: COMMUNITY_WRITE_BODY_MAX,
    titleMaxLength: COMMUNITY_WRITE_TITLE_MAX,
    photoMax: COMMUNITY_WRITE_PHOTO_MAX,
  };
}

/** 작성 완료 시 POST 본문 예시 */
export function buildCreateCommunityPostRequestDto(input: {
  category: string;
  topic: string;
  title: string;
  body: string;
  imageRefs?: string[];
}): CreateCommunityPostRequestDto {
  return {
    category: input.category,
    topic: input.topic,
    title: input.title,
    body: input.body,
    imageRefs: input.imageRefs ?? [],
  };
}
