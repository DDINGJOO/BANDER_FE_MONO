import { useEffect, useState } from 'react';
import { ApiError, getJson } from '../api/client';
import { COMMUNITY_WRITE_CATEGORIES } from '../data/communityWrite';
import type { CommunityFeedItemDto } from '../data/schemas/community';
import { requestGuestGate } from '../lib/guestGate';

export const COMMUNITY_CATEGORY_ALL_LABEL = '전체' as const;

export const COMMUNITY_FEED_CATEGORY_OPTIONS = [
  COMMUNITY_CATEGORY_ALL_LABEL,
  ...COMMUNITY_WRITE_CATEGORIES,
] as const;

export const COMMUNITY_FEED_SORT_OPTIONS = [
  { label: '최신순', value: 'latest' },
  { label: '인기순', value: 'popular' },
  { label: '댓글많은순', value: 'comments' },
] as const;

export const COMMUNITY_FEED_PAGE_SIZE = 20;

type CommunityFeedApiItem = Partial<CommunityFeedItemDto> & {
  author?: string | null;
  authorName?: string | null;
  comments?: number | null;
  content?: string | null;
  createdAt?: string | null;
  detailPath?: string | null;
  id?: number | string;
  likeCount?: number | null;
  postId?: number | string;
  slug?: string | null;
  thumbnail?: string | null;
  totalCount?: number;
  totalElements?: number;
  writerName?: string | null;
};

type CommunityFeedApiPage = {
  content?: CommunityFeedApiItem[];
  hasNext?: boolean;
  items?: CommunityFeedApiItem[];
  last?: boolean;
  number?: number;
  page?: number;
  size?: number;
  totalCount?: number;
  totalElements?: number;
};

type CommunityFeedApiResponse = CommunityFeedApiPage | { page?: CommunityFeedApiPage };

export type CommunityFeedCard = {
  authorNickname: string;
  category: string;
  commentCount: number;
  detailSlug?: string;
  excerpt: string;
  id: string;
  likes: number;
  postedAtLabel: string;
  thumbnail?: string;
  title: string;
};

export type CommunityFeedCategory = (typeof COMMUNITY_FEED_CATEGORY_OPTIONS)[number];
export type CommunityFeedSort = (typeof COMMUNITY_FEED_SORT_OPTIONS)[number]['value'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function extractPage(response: CommunityFeedApiResponse): CommunityFeedApiPage {
  if (isRecord(response) && isRecord(response.page)) {
    return response.page as CommunityFeedApiPage;
  }
  return response as CommunityFeedApiPage;
}

function formatPostedAtLabel(createdAt?: string | null, postedAtLabel?: string | null) {
  const explicitLabel = toNonEmptyString(postedAtLabel);
  if (explicitLabel) {
    return explicitLabel;
  }

  if (!createdAt) {
    return '방금';
  }

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return '방금';
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSeconds < 60) {
    return '방금';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  return parsed.toLocaleDateString('ko-KR', {
    day: 'numeric',
    month: 'short',
  });
}

function resolveDetailSlug(row: CommunityFeedApiItem): string | undefined {
  const detailSlug = toNonEmptyString(row.detailSlug) ?? toNonEmptyString(row.slug);
  if (detailSlug) {
    return detailSlug;
  }

  const detailPath = toNonEmptyString(row.detailPath);
  if (detailPath) {
    const segments = detailPath.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) {
      return last;
    }
  }

  if (typeof row.id === 'number' || typeof row.id === 'string') {
    return String(row.id);
  }

  if (typeof row.postId === 'number' || typeof row.postId === 'string') {
    return String(row.postId);
  }

  return undefined;
}

function normalizeItem(row: CommunityFeedApiItem): CommunityFeedCard {
  const detailSlug = resolveDetailSlug(row);
  const excerpt =
    toNonEmptyString(row.excerpt) ??
    toNonEmptyString(row.content) ??
    '';

  const id = detailSlug ?? `${row.title}-${row.createdAt ?? 'community-feed-item'}`;

  return {
    authorNickname:
      toNonEmptyString(row.authorNickname) ??
      toNonEmptyString(row.authorName) ??
      toNonEmptyString(row.author) ??
      toNonEmptyString(row.writerName) ??
      '밴더유저',
    category: toNonEmptyString(row.category) ?? '커뮤니티',
    commentCount: toNumber(row.commentCount ?? row.comments, 0),
    detailSlug,
    excerpt,
    id,
    likes: toNumber(row.likes ?? row.likeCount, 0),
    postedAtLabel: formatPostedAtLabel(row.createdAt, row.postedAtLabel),
    thumbnail: toNonEmptyString(row.thumbnailUrl) ?? toNonEmptyString(row.thumbnail),
    title: toNonEmptyString(row.title) ?? '제목 없는 글',
  };
}

function resolveHasNextPage(page: CommunityFeedApiPage, currentPage: number, pageSize: number, totalCount: number) {
  if (typeof page.hasNext === 'boolean') {
    return page.hasNext;
  }

  if (typeof page.last === 'boolean') {
    return !page.last;
  }

  return totalCount > (currentPage + 1) * pageSize;
}

function buildErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return '커뮤니티 글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
}

export function useCommunityFeed() {
  const [activeCategory, setActiveCategory] =
    useState<CommunityFeedCategory>(COMMUNITY_CATEGORY_ALL_LABEL);
  const [items, setItems] = useState<CommunityFeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<CommunityFeedSort>('latest');
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFeed = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams();
        params.set('category', activeCategory === COMMUNITY_CATEGORY_ALL_LABEL ? '' : activeCategory);
        params.set('sort', sort);
        params.set('page', String(page));
        params.set('size', String(COMMUNITY_FEED_PAGE_SIZE));

        const response = await getJson<CommunityFeedApiResponse>(
          `/api/v1/posts?${params.toString()}`,
          { signal: controller.signal }
        );

        const normalizedPage = extractPage(response);
        const nextItems = (normalizedPage.items ?? normalizedPage.content ?? []).map(normalizeItem);
        const nextTotalCount = toNumber(
          normalizedPage.totalCount ?? normalizedPage.totalElements,
          nextItems.length
        );
        const responsePage = toNumber(normalizedPage.page ?? normalizedPage.number, page);
        const responseSize = toNumber(normalizedPage.size, COMMUNITY_FEED_PAGE_SIZE);

        setItems(nextItems);
        setTotalCount(nextTotalCount);
        setHasNextPage(
          resolveHasNextPage(normalizedPage, responsePage, responseSize, nextTotalCount)
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          requestGuestGate('/community');
          return;
        }

        setItems([]);
        setTotalCount(0);
        setHasNextPage(false);
        setErrorMessage(buildErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchFeed();

    return () => {
      controller.abort();
    };
  }, [activeCategory, page, sort]);

  const selectedSortOption =
    COMMUNITY_FEED_SORT_OPTIONS.find((option) => option.value === sort) ??
    COMMUNITY_FEED_SORT_OPTIONS[0];

  return {
    activeCategory,
    categoryOptions: COMMUNITY_FEED_CATEGORY_OPTIONS,
    errorMessage,
    goToNextPage: () => setPage((current) => (hasNextPage ? current + 1 : current)),
    goToPreviousPage: () => setPage((current) => Math.max(0, current - 1)),
    hasNextPage,
    hasPreviousPage: page > 0,
    items,
    loading,
    page,
    selectedSortOption,
    setCategory: (category: CommunityFeedCategory) => {
      setActiveCategory(category);
      setPage(0);
    },
    setSortOption: (nextSort: CommunityFeedSort) => {
      setSort(nextSort);
      setPage(0);
    },
    sortOptions: COMMUNITY_FEED_SORT_OPTIONS,
    totalCount,
  };
}
