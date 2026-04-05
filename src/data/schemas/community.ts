/**
 * 커뮤니티 — 목록·상세·댓글·작성 (백엔드 경로는 팀 합의 후 확정; DTO는 화면 바인딩용)
 * 관련 UI: communityFeed, communityPostDetail, communityWrite, SearchResults 커뮤니티 탭
 */

import type { ApiOffsetPageDto } from './common';

/** 목록 칩/정렬 옵션은 API 또는 정적 메타에서 */
export type CommunitySortOptionDto = string;

/** GET /api/v1/community/feed | 검색 posts와 유사 */
export type CommunityFeedItemDto = {
  /** 목록 API에서 내려주면 상세·추적에 사용 */
  id?: string;
  category: string;
  excerpt: string;
  likes: number;
  thumbnailUrl?: string | null;
  /** 목업 전용(CSS/URL) — API 표준은 thumbnailUrl */
  thumbnail?: string;
  title: string;
  detailSlug?: string;
  /** 목록 메타 (옵션) */
  authorNickname?: string;
  postedAtLabel?: string;
  commentCount?: number;
};

export type CommunityFeedPageResponseDto = ApiOffsetPageDto<CommunityFeedItemDto>;

export type CommunityCommentActionDto = 'reply' | 'report' | 'delete';

export type CommunityCommentDto = {
  id: string;
  author: string;
  authorNote?: string;
  avatarUrl: string;
  timeLabel: string;
  body: string;
  mention?: string;
  actions: CommunityCommentActionDto[];
};

export type CommunityCommentThreadDto = {
  root: CommunityCommentDto;
  replies: CommunityCommentDto[];
};

/** GET /api/v1/community/posts/{slug} */
export type CommunityPostDetailResponseDto = {
  id: string;
  slug: string;
  categoryLabel: string;
  title: string;
  body: string;
  author: string;
  authorAvatarUrl: string;
  postedAt: string;
  heroImageUrl: string;
  likes: number;
  likedByViewer?: boolean;
  commentCount: number;
  adjacent: {
    prev: { title: string; date: string; slug?: string };
    next: { title: string; date: string; slug?: string };
  };
  commentThreads: CommunityCommentThreadDto[];
};

/** POST /api/v1/community/posts */
export type CreateCommunityPostRequestDto = {
  category: string;
  topic: string;
  title: string;
  body: string;
  imageRefs?: string[];
};

export type CreateCommunityPostResponseDto = {
  id: string;
  slug: string;
};

/** 정적 메타: 글쓰기 카테고리/주제 (GET /api/v1/meta/community-write 옵션) */
export type CommunityWriteMetaResponseDto = {
  categories: string[];
  topics: string[];
  bodyMaxLength: number;
  titleMaxLength: number;
  photoMax: number;
};
