import { getJson } from './client';
import type { SearchSuggestionsResponseDto } from '../data/schemas/search';

export type RoomSearchItem = {
  roomId: string;
  studioId: string;
  studioName: string;
  roomName: string;
  roomSlug: string;
  studioSlug: string;
  description: string;
  category: string;
  parkingAvailable: boolean;
  minCapacity: number;
  maxCapacity: number;
  pricePerSlot: number;
  slotUnit: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  available: boolean;
  popularityScore: number;
  thumbnailUrl: string | null;
};

export type RoomSearchResponse = {
  rooms: RoomSearchItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type VendorSearchItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  thumbnailUrl: string;
};

export type CursorPageResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number | null;
  size: number;
};

export type PostSearchItem = {
  id: string;
  title: string;
  authorUserId: string;
  authorNickname?: string | null;
  category?: string | null;
  commentCount?: number | null;
  createdAt: string;
  excerpt?: string | null;
  likeCount?: number | null;
  viewCount?: number | null;
};

type RoomSearchParams = {
  q?: string;
  category?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  parking?: boolean;
  sort?: string;
  page?: number;
  size?: number;
};

type VendorSearchParams = {
  q?: string;
  sort?: string;
  cursor?: string;
  size?: number;
};

type PostSearchParams = {
  q?: string;
  cursor?: string;
  size?: number;
};

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export function searchRooms(params: RoomSearchParams) {
  return getJson<RoomSearchResponse>(`/api/v1/search/rooms${buildQuery(params)}`);
}

export function searchVendors(params: VendorSearchParams) {
  return getJson<CursorPageResponse<VendorSearchItem>>(`/api/v1/search/vendors${buildQuery(params)}`);
}

export function searchPosts(params: PostSearchParams) {
  return getJson<CursorPageResponse<PostSearchItem>>(`/api/v1/search/posts${buildQuery(params)}`);
}


export function searchSuggestions(prefix: string, size = 10) {
  return getJson<SearchSuggestionsResponseDto>(
    `/api/v1/search/suggestions?prefix=${encodeURIComponent(prefix)}&size=${size}`
  );
}
