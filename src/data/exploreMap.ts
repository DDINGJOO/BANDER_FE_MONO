/** 탐색_맵 공통 view model 타입 (검색·필터는 HomeSpaceExplorer variant="map"과 동일) */

export type ExploreMapListItem = {
  bookmarkSaved: boolean;
  detailPath: string;
  image: string;
  location: string;
  priceLabel: string;
  priceSuffix: string;
  rating: string;
  spaceType: string;
  studio: string;
  tags: [string, string];
  title: string;
};

export type ExploreMapPopularVendor = {
  avatarStyle: string;
  label: string;
  slug: string;
};

export type ExploreMapMarker = {
  detailPath: string;
  lat: number;
  lng: number;
  pinStyle?: 'active' | 'default';
  title: string;
};

/** 홍대·합정 인근 중심 좌표 */
export const EXPLORE_MAP_CENTER = {
  lat: 37.5537,
  lng: 126.9233,
} as const;
