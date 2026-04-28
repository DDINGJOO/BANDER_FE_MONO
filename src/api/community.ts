import { deleteJson, getJson, postJson } from './client';

export type CommunityPostBlockType = 'TEXT' | 'IMAGE' | 'CODE';

export type PostBlockDto = {
  blockId?: string;
  blockType: CommunityPostBlockType | string;
  content: string;
  sortOrder?: number;
  /**
   * R1-G: denormalized CDN URL for IMAGE blocks. Server populates this
   * alongside `content` (mediaRef) at create/update time so the FE skips
   * the per-render media-service round-trip. NULL on TEXT/CODE blocks
   * and on legacy IMAGE rows that pre-date the V7 migration.
   */
  imageUrl?: string | null;
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
  /**
   * R2-B: denormalized author profile CDN URL fanned out from
   * USER_PROFILE_UPDATED. FE prefers this over authorProfileImageRef
   * when present (resolveProfileImageUrl(ref, url)).
   */
  authorProfileImageUrl?: string | null;
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
  /**
   * R2-B: denormalized author profile CDN URL fanned out from
   * USER_PROFILE_UPDATED. FE prefers this over authorProfileImageRef
   * when present (resolveProfileImageUrl(ref, url)). Null on tombstone
   * comments and on legacy rows that pre-date the V8 community migration.
   */
  authorProfileImageUrl?: string | null;
  /**
   * 삭제된 댓글(tombstone) 인 경우 null. 자식 답글이 살아있을 때만 부모가 tombstone 으로 응답에 노출된다.
   */
  content: string | null;
  depth: number;
  createdAt: string;
  /**
   * 부모 댓글이 삭제되었지만 살아있는 자식 답글이 있어 tombstone 으로 노출되는 경우 true.
   * true 인 경우 content/authorNickname/authorProfileImageRef 는 모두 null 이며, "삭제된 댓글입니다" 로 렌더한다.
   * (구버전 응답 호환을 위해 optional. 미정의는 false 로 간주.)
   */
  deleted?: boolean;
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
    /** Required for IMAGE blocks under PR-G partial: media UUID from media-svc. */
    mediaId?: string;
    /** Required for IMAGE blocks under PR-G partial: JWS ownership ticket from media-svc. */
    ownershipTicket?: string;
    /**
     * R1-G: denormalized CDN URL for IMAGE blocks. Optional; the server
     * persists this alongside the mediaRef so subsequent reads skip the
     * media-service round-trip for URL resolution. Server ignores the
     * field on TEXT/CODE blocks.
     */
    imageUrl?: string;
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
  /** JWS ownership ticket — required when applying to entity (PR-G/PR-H). */
  ownershipTicket?: string;
};

export function requestPostInlineImageUpload(input: {
  contentLength: number;
  contentType: string;
  fileName: string;
}) {
  return postJson<MediaUploadGrantDto>('/api/v1/media/uploads', {
    contentLength: input.contentLength,
    contentType: input.contentType,
    fileName: input.fileName,
    ownerKey: null,
    ownerType: 'POST',
    targetType: 'POST_INLINE_IMAGE',
  });
}

/**
 * Upload + commit a post inline image (ticket flow).
 *
 * Flow:
 *   1. POST /api/v1/media/uploads → mediaRef + presignedUrl + ownershipTicket
 *   2. PUT to S3
 *   3. POST /api/v1/media/{mediaRef}/commit (sha256 + size verified server-side)
 *   4. Return the media UUID, public URL, and ownership ticket so the caller can
 *      thread them into the IMAGE block when submitting the post.
 *
 * The commit step is performed eagerly (right after PUT) so the ticket reaches
 * COMMITTED state before the user submits the post. SQS auto-commit safety net
 * still covers the case where this commit call fails after a successful PUT.
 */
export async function uploadPostInlineImage(input: {
  file: File;
  ownerKey: string;
}): Promise<{
  mediaRef: string;
  mediaId: string;
  ownershipTicket: string;
  /**
   * R1-G: denormalized CDN URL returned by the upload grant. Threaded into
   * the IMAGE block's `imageUrl` field on create/update so the server can
   * persist it next to the mediaRef and the FE can skip per-read URL
   * resolution. May be empty when the grant is from a legacy/stub backend.
   */
  imageUrl: string;
}> {
  const grant = await requestPostInlineImageUpload({
    contentLength: input.file.size,
    contentType: input.file.type,
    fileName: input.file.name,
  });

  const { putAndCommit } = await import('./media');
  await putAndCommit({
    mediaId: grant.mediaRef,
    uploadUrl: grant.uploadUrl,
    uploadHeaders: grant.uploadHeaders,
    ownershipTicket: grant.ownershipTicket,
    file: input.file,
  });

  return {
    mediaRef: grant.publicUrl || grant.mediaRef,
    mediaId: grant.mediaRef,
    ownershipTicket: grant.ownershipTicket ?? '',
    imageUrl: grant.publicUrl ?? '',
  };
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
  /**
   * R2-B: denormalized author profile CDN URL fanned out from
   * USER_PROFILE_UPDATED. FE prefers this over authorProfileImageRef
   * when present.
   */
  authorProfileImageUrl?: string | null;
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

export function fetchUserMiniFeed(
  userId: string,
  params: {
    page?: number;
    size?: number;
    sort: MiniFeedSort;
    tab: MiniFeedTab;
  }
) {
  const search = new URLSearchParams({
    tab: params.tab,
    sort: params.sort,
    page: String(params.page ?? 0),
    size: String(params.size ?? 20),
  });

  return getJson<MiniFeedResponseDto>(
    `/api/v1/users/${encodeURIComponent(userId)}/feed/posts?${search.toString()}`
  );
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
