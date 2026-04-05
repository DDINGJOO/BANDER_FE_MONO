/**
 * UC-05 통합 검색 — GET /api/v1/search/spaces|vendors|posts
 * @see docs/BACKEND_API.md §4
 */

import type { ApiOffsetPageDto } from './common';

export type SearchSpaceItemDto = {
  slug: string;
  title: string;
  studioName: string;
  location: string;
  priceLabel: string;
  rating: string;
  thumbnailUrl: string;
  tags: string[];
};

export type SearchVendorItemDto = {
  slug: string;
  name: string;
  spaceCountLabel: string;
  thumbnailOrTone: string;
};

export type SearchCommunityPostItemDto = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  likes: number;
  thumbnailStyle: string | null;
};

export type SearchSpacesResponseDto = ApiOffsetPageDto<SearchSpaceItemDto>;
export type SearchVendorsResponseDto = ApiOffsetPageDto<SearchVendorItemDto>;
export type SearchPostsResponseDto = ApiOffsetPageDto<SearchCommunityPostItemDto>;

/** GET /api/v1/search/suggestions?prefix= */
export type SearchSuggestionItemDto = {
  text: string;
  /** 선택: 보조 표시 */
  highlight?: string;
};

export type SearchSuggestionsResponseDto = {
  suggestions: SearchSuggestionItemDto[];
};
