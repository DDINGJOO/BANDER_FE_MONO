/**
 * 내 미니피드 — 제안: GET /api/v1/users/me/feed/posts
 * (작성한 글 / 댓글단 글, 정렬·페이징)
 */

import type { ApiOffsetPageDto } from './common';
import type { CommunityFeedItemDto } from './community';

export type UserMiniFeedTabDto = 'written' | 'commented';

export type UserMiniFeedProfileDto = {
  userId?: string;
  nickname: string;
  joinLabel: string;
  bio: string;
  profileImageUrl: string;
  tags: string[];
};

/** 피드 아이템 — 커뮤니티 카드 + 미니피드 메타 */
export type UserMiniFeedPostDto = CommunityFeedItemDto & {
  excerptLines?: string[];
  authorAvatarUrl?: string;
  /** 데모 필드 — API 표준은 authorAvatarUrl */
  authorAvatar?: string;
  authorName?: string;
  timeLabel?: string;
  comments?: number;
};

export type UserMiniFeedResponseDto = {
  profile: UserMiniFeedProfileDto;
  tab: UserMiniFeedTabDto;
  sort: string;
  page: ApiOffsetPageDto<UserMiniFeedPostDto>;
};
