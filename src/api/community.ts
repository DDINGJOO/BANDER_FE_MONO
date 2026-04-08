import { getJson } from './client';

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
