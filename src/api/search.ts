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
  /** PR-A1: vendor 가 보유한 공간 수 (마커 라벨 "공간 N" 표시용) */
  roomCount?: number;
  /** PR-A1: 지도 마커용 좌표 — 좌표 미제공 vendor 는 카드 리스트에만 노출 */
  latitude?: number;
  longitude?: number;
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
  regions?: string[];
  keywords?: string[];
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  parking?: boolean;
  dayOfWeek?: string;
  startHour?: number;
  endHour?: number;
  sort?: string;
  page?: number;
  size?: number;
};

type VendorSearchParams = {
  q?: string;
  sort?: 'relevance' | 'popular' | 'latest';
  cursor?: string;
  size?: number;
  /** PR-A1: 같은 키 반복으로 직렬화 (regions=A&regions=B) */
  regions?: string[];
  /** PR-A1: 같은 키 반복. 선행 # 은 호출부에서 제거하고 넘긴다 */
  keywords?: string[];
  /** PR-A1: 객체로 받아서 "swLat,swLng,neLat,neLng" 단일 문자열로 직렬화 */
  bbox?: { swLat: number; swLng: number; neLat: number; neLng: number };
  /** PR-A2: 백엔드 nested rooms 매핑으로 정확 매치 (capacity/parking/category). */
  capacity?: number;
  parking?: boolean;
  category?: string;
  /**
   * PR-A2: 백엔드는 minPrice/maxPrice 도 받지만 FE 가격 필터 UI 가 없어 호출부는
   * 보내지 않음 — 가격 필터 UI 신설 시 forward-compat 으로 타입에만 포함.
   */
  minPrice?: number;
  maxPrice?: number;
};

type PostSearchParams = {
  q?: string;
  cursor?: string;
  size?: number;
};

function buildQuery(params: Record<string, string | number | boolean | string[] | undefined>): string {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => search.append(key, item));
      return;
    }

    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export function searchRooms(params: RoomSearchParams) {
  return getJson<RoomSearchResponse>(`/api/v1/search/rooms${buildQuery(params)}`);
}

export function searchVendors(params: VendorSearchParams) {
  const { bbox, ...rest } = params;
  // bbox 는 단일 문자열로 변환해 buildQuery 에 위임 — buildQuery 는 객체를 모른다.
  const flat: Record<string, string | number | boolean | string[] | undefined> = { ...rest };
  if (bbox) {
    flat.bbox = `${bbox.swLat},${bbox.swLng},${bbox.neLat},${bbox.neLng}`;
  }
  return getJson<CursorPageResponse<VendorSearchItem>>(`/api/v1/search/vendors${buildQuery(flat)}`);
}

export function searchPosts(params: PostSearchParams) {
  return getJson<CursorPageResponse<PostSearchItem>>(`/api/v1/search/posts${buildQuery(params)}`);
}


export function searchSuggestions(prefix: string, size = 10) {
  return getJson<SearchSuggestionsResponseDto>(
    `/api/v1/search/suggestions?prefix=${encodeURIComponent(prefix)}&size=${size}`
  );
}
