import { deleteJson, getJson, postJson } from './client';

export type CommunityPostBlockType = 'TEXT' | 'IMAGE' | 'CODE';

export type PostBlockDto = {
  blockId?: string;
  blockType: CommunityPostBlockType | string;
  content: string;
  sortOrder?: number;
};

export type CommunityPostBlockDto = PostBlockDto;

export type CommunityAdjacentPostDto = {
  postId?: string | null;
  slug?: string | null;
  title: string;
  date?: string | null;
  createdAt?: string | null;
};

export type PostDetailDto = {
  postId: string;
  authorUserId: string;
  authorNickname: string | null;
  authorProfileImageRef: string | null;
  title: string;
  category?: string | null;
  topic?: string | null;
  status: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  blocks: PostBlockDto[];
  createdAt: string;
  updatedAt: string;
  categoryLabel?: string | null;
  likedByViewer?: boolean;
  adjacent?: {
    prev?: CommunityAdjacentPostDto | null;
    next?: CommunityAdjacentPostDto | null;
  } | null;
};

export type CommunityPostDetailDto = PostDetailDto;

export function fetchPostDetail(postId: string) {
  return getJson<PostDetailDto>(`/api/v1/posts/${encodeURIComponent(postId)}`);
}

export function fetchCommunityPostDetail(postId: string) {
  return fetchPostDetail(postId);
}

export type CommentDto = {
  commentId: string;
  postId: string;
  parentId: string | null;
  authorUserId: string;
  authorNickname: string | null;
  authorProfileImageRef: string | null;
  content: string;
  depth: number;
  createdAt: string;
};

export type CommunityCommentDto = CommentDto;

export type CommentTreeDto = {
  comment: CommentDto;
  replies: CommentDto[];
};

export type CommunityCommentTreeDto = CommentTreeDto;

export function fetchPostComments(postId: string) {
  return getJson<CommentTreeDto[]>(`/api/v1/posts/${encodeURIComponent(postId)}/comments`);
}

export function fetchCommunityPostComments(postId: string) {
  return fetchPostComments(postId);
}

export type CreatePostRequest = {
  title: string;
  category?: string;
  topic?: string;
  blocks: Array<{
    blockType: CommunityPostBlockType;
    content: string;
  }>;
};

export type CreateCommunityPostRequest = CreatePostRequest;

export function createPost(request: CreatePostRequest) {
  return postJson<PostDetailDto>('/api/v1/posts', request);
}

export function createCommunityPost(request: CreateCommunityPostRequest) {
  return createPost(request);
}

export type CreateCommentRequest = {
  content: string;
  /**
   * 대댓글 부모 ID. Snowflake 기반 ID 는 64bit 이므로 JS Number 의
   * 정밀도(53bit)를 초과할 수 있다. 반드시 string 으로 전달해야 한다.
   */
  parentId?: string;
};

export type CreateCommunityCommentRequest = CreateCommentRequest;

export function createComment(postId: string, request: CreateCommentRequest) {
  return postJson<CommentDto>(`/api/v1/posts/${encodeURIComponent(postId)}/comments`, request);
}

export function createCommunityComment(
  postId: string,
  request: CreateCommunityCommentRequest
) {
  return createComment(postId, request);
}

export async function deleteCommentApi(postId: string, commentId: string) {
  await deleteJson<null>(
    `/api/v1/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`
  );
}

export function deleteCommunityComment(postId: string, commentId: string) {
  return deleteCommentApi(postId, commentId);
}

export type ReactionToggleResponse = {
  liked: boolean;
};

export type CommunityReactionToggleResponse = ReactionToggleResponse;

export function toggleReaction(postId: string) {
  return postJson<ReactionToggleResponse>(
    `/api/v1/posts/${encodeURIComponent(postId)}/reactions`,
    {}
  );
}

export function toggleCommunityReaction(postId: string) {
  return toggleReaction(postId);
}

export type MediaUploadGrantDto = {
  mediaRef: string;
  uploadUrl: string;
  publicUrl: string;
  uploadHeaders?: Record<string, string>;
  expiresAt: string;
  targetType?: string;
  stubbed?: boolean;
};

function buildUploadHeaders(grant: MediaUploadGrantDto, file: File) {
  const headers = new Headers(grant.uploadHeaders ?? {});
  if (!headers.has('Content-Type') && file.type) {
    headers.set('Content-Type', file.type);
  }
  return headers;
}

export function requestPostInlineImageUpload(input: {
  contentLength: number;
  contentType: string;
  fileName: string;
  ownerKey: string;
}) {
  return postJson<MediaUploadGrantDto>('/api/v1/media/uploads', {
    contentLength: input.contentLength,
    contentType: input.contentType,
    fileName: input.fileName,
    ownerKey: input.ownerKey,
    ownerType: 'USER',
    targetType: 'POST_INLINE_IMAGE',
  });
}

export async function uploadPostInlineImage(input: { file: File; ownerKey: string }) {
  const grant = await requestPostInlineImageUpload({
    contentLength: input.file.size,
    contentType: input.file.type,
    fileName: input.file.name,
    ownerKey: input.ownerKey,
  });

  const uploadResponse = await fetch(grant.uploadUrl, {
    body: input.file,
    headers: buildUploadHeaders(grant, input.file),
    method: 'PUT',
  });

  if (!uploadResponse.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  return grant.mediaRef;
}

export type MiniFeedTab = 'written' | 'commented';
export type MiniFeedSort = 'latest' | 'popular' | 'comments';

export type MiniFeedProfileDto = {
  userId?: string;
  nickname: string;
  joinLabel?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  profileImageRef?: string | null;
  tags?: string[] | string | null;
  createdAt?: string | null;
};

export type MiniFeedPostDto = {
  postId?: string;
  id?: string;
  title: string;
  category?: string | null;
  excerpt?: string | null;
  excerptLines?: string[] | null;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  authorAvatar?: string | null;
  authorAvatarUrl?: string | null;
  authorProfileImageRef?: string | null;
  authorName?: string | null;
  authorNickname?: string | null;
  timeLabel?: string | null;
  createdAt?: string | null;
  likes?: number | null;
  likeCount?: number | null;
  comments?: number | null;
  commentCount?: number | null;
  detailSlug?: string | null;
  slug?: string | null;
};

export type OffsetPageResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type SpringPageResponse<T> = {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
};

export type MiniFeedResponseDto = {
  profile: MiniFeedProfileDto;
  tab?: MiniFeedTab;
  sort?: string;
  page: OffsetPageResponse<MiniFeedPostDto> | SpringPageResponse<MiniFeedPostDto>;
};

export function fetchMyMiniFeed(params: {
  page?: number;
  size?: number;
  sort: MiniFeedSort;
  tab: MiniFeedTab;
}) {
  const search = new URLSearchParams({
    tab: params.tab,
    sort: params.sort,
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  });

  return getJson<MiniFeedResponseDto>(`/api/v1/users/me/feed/posts?${search.toString()}`);
}

export function normalizeMiniFeedPage<T>(
  page: OffsetPageResponse<T> | SpringPageResponse<T>
) {
  if ('items' in page) {
    return page;
  }

  return {
    hasNext: !page.last,
    items: page.content,
    page: page.number,
    size: page.size,
    totalCount: page.totalElements,
  };
}
