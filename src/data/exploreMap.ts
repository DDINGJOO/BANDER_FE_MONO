/** Figma 탐색_맵(6132:33605) — 인기 업체·지도 핀 (검색·필터는 HomeSpaceExplorer variant="map"과 동일) */

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

const THUMB_A = 'https://www.figma.com/api/mcp/asset/aa910e8b-35a9-4295-9f5e-7c97b2bc514f';
const THUMB_A2 = 'https://www.figma.com/api/mcp/asset/6bd447b2-a525-424d-8bcf-d86cee55284e';
const THUMB_B = 'https://www.figma.com/api/mcp/asset/7ad596f4-4c0a-4a2e-aaf6-c2cd80f6bb3a';
const THUMB_7 = 'https://www.figma.com/api/mcp/asset/c1c89983-892a-473c-893f-8018ed149c33';

export const EXPLORE_MAP_LIST_ITEMS: ExploreMapListItem[] = [
  {
    bookmarkSaved: false,
    detailPath: '/spaces/a-room-grand-piano-rental',
    image: THUMB_A,
    location: '서울 마포구 동교동',
    priceLabel: '10,000원',
    priceSuffix: '/60분',
    rating: '4.5',
    spaceType: '합주실',
    studio: '유스뮤직',
    tags: ['주차가능', '예약가능'],
    title: 'A룸 그랜드 피아노 대관',
  },
  {
    bookmarkSaved: true,
    detailPath: '/spaces/yeongchang-upright-room',
    image: THUMB_B,
    location: '서울 마포구 동교동',
    priceLabel: '10,000원',
    priceSuffix: '/60분',
    rating: '4.5',
    spaceType: '합주실',
    studio: '유스뮤직',
    tags: ['주차가능', '예약가능'],
    title: 'B룸 보컬트레이닝 전용',
  },
  {
    bookmarkSaved: false,
    detailPath: '/spaces/jazz-ensemble-room',
    image: THUMB_A2,
    location: '서울 마포구 동교동',
    priceLabel: '10,000원',
    priceSuffix: '/60분',
    rating: '4.5',
    spaceType: '합주실',
    studio: '유스뮤직',
    tags: ['주차가능', '예약가능'],
    title: '2번방 기타, 디지털 피아노',
  },
  {
    bookmarkSaved: false,
    detailPath: '/spaces/yamaha-u3-room',
    image: THUMB_7,
    location: '서울 마포구 동교동',
    priceLabel: '10,000원',
    priceSuffix: '/60분',
    rating: '4.5',
    spaceType: '합주실',
    studio: '유스뮤직',
    tags: ['주차가능', '예약가능'],
    title: '7번방 마이크, 디지털 피아노',
  },
];

export type ExploreMapPopularVendor = {
  avatarStyle: string;
  label: string;
  slug: string;
};

/** 캐러셀 라벨은 Figma 그대로, slug는 기존 벤더 상세로 연결 */
export const EXPLORE_MAP_POPULAR_VENDORS: ExploreMapPopularVendor[] = [
  {
    avatarStyle: 'linear-gradient(135deg, #7f1315, #e26447)',
    label: '유스뮤직',
    slug: 'youth-music',
  },
  {
    avatarStyle: 'linear-gradient(135deg, #6b4d24, #c5a071)',
    label: '방구석 뮤지션의 합주실',
    slug: 'banggu-musician',
  },
  {
    avatarStyle: 'linear-gradient(135deg, #bcbcbc, #ececec)',
    label: '렛츠코뮤직',
    slug: 'chats-music',
  },
  {
    avatarStyle: 'linear-gradient(135deg, #1a1a1a, #4a4a4a)',
    label: '블랙피어스 합주실',
    slug: 'from-studio',
  },
];

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

/** 탐색 목록 카드와 대응하는 지도 마커 */
export const EXPLORE_MAP_MARKERS: ExploreMapMarker[] = [
  {
    detailPath: '/spaces/a-room-grand-piano-rental',
    lat: 37.5547,
    lng: 126.9239,
    title: 'A룸 그랜드 피아노 대관',
  },
  {
    detailPath: '/spaces/yeongchang-upright-room',
    lat: 37.5529,
    lng: 126.9227,
    pinStyle: 'active',
    title: 'B룸 보컬트레이닝 전용',
  },
  {
    detailPath: '/spaces/jazz-ensemble-room',
    lat: 37.5542,
    lng: 126.9255,
    title: '2번방 기타, 디지털 피아노',
  },
  {
    detailPath: '/spaces/yamaha-u3-room',
    lat: 37.5522,
    lng: 126.9246,
    title: '7번방 마이크, 디지털 피아노',
  },
];
