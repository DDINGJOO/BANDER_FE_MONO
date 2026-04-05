/**
 * 공통 페이징·래퍼 타입 — docs/BACKEND_API.md §19
 */

/** 오프셋 페이징 (검색·목록) */
export type ApiOffsetPageDto<T> = {
  items: T[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
};

/** 커서 페이징 (알림 등) */
export type ApiCursorPageDto<T> = {
  items: T[];
  nextCursor?: string | null;
};
