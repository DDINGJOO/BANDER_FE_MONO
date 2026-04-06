import { getJson } from './client';

export type RoomSearchItem = {
  roomId: number;
  studioId: number;
  studioName: string;
  roomName: string;
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
  createdAt: string;
};

type RoomSearchParams = {
  q?: string;
  category?: string;
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

function buildQuery(params: Record<string, string | number | undefined>): string {
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
