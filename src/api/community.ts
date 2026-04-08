import { getJson, postJson, deleteJson } from './client';

export type PostBlockDto = {
  blockId?: number;
  blockType: 'TEXT' | 'IMAGE' | 'CODE';
  content: string;
  sortOrder: number;
};

export type PostDetailDto = {
  postId: number;
  authorUserId: number;
  title: string;
  status: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  blocks: PostBlockDto[];
  createdAt: string;
  updatedAt: string;
};

export function fetchPostDetail(postId: string) {
  return getJson<PostDetailDto>(`/api/v1/posts/${encodeURIComponent(postId)}`);
}

export type CommentDto = {
  commentId: number;
  postId: number;
  parentId: number | null;
  authorUserId: number;
  content: string;
  depth: number;
  createdAt: string;
};

export type CommentTreeDto = {
  comment: CommentDto;
  replies: CommentDto[];
};

export function fetchPostComments(postId: string) {
  return getJson<CommentTreeDto[]>(`/api/v1/posts/${encodeURIComponent(postId)}/comments`);
}

export type CreatePostRequest = {
  title: string;
  blocks: { blockType: 'TEXT' | 'IMAGE' | 'CODE'; content: string }[];
};

export function createPost(request: CreatePostRequest) {
  return postJson<PostDetailDto>('/api/v1/posts', request);
}

export type CreateCommentRequest = {
  content: string;
  parentId?: number;
};

export function createComment(postId: string, request: CreateCommentRequest) {
  return postJson<CommentDto>(`/api/v1/posts/${encodeURIComponent(postId)}/comments`, request);
}

export function deleteCommentApi(postId: string, commentId: string) {
  return deleteJson<void>(`/api/v1/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`);
}

export type ReactionToggleResponse = {
  liked: boolean;
};

export function toggleReaction(postId: string) {
  return postJson<ReactionToggleResponse>(`/api/v1/posts/${encodeURIComponent(postId)}/reactions`, {});
}
