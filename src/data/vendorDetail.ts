import type { VendorBasicInfoRow } from '../types/vendorBasicInfo';
import { HOME_SPACE_CARDS } from './home';
import {
  ROOM_DETAIL_INFO_ROWS,
  ROOM_DETAIL_DATA,
  SPACE_DETAIL_SUMMARY_HASH_TAGS,
} from './spaceDetail';

function parseHoursLine(value: string): { dayLabel?: string; hoursLine: string } {
  const m = value.trim().match(/^([월화수목금토일])\s+(.+)$/);
  if (m) {
    return { dayLabel: m[1], hoursLine: m[2]!.trim() };
  }
  return { hoursLine: value.trim() };
}

function splitParking(value: string): { left: string; right: string } {
  const parts = value.split(/[·•]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { left: parts[0]!, right: parts[1]! };
  }
  return { left: value.trim(), right: '' };
}

function roomDetailRowToBasic(row: { label: string; value: string }): VendorBasicInfoRow {
  const v = row.value;
  switch (row.label) {
    case '주소': {
      const parts = v.split('\n');
      const primaryLine = parts[0]?.trim() ?? v.trim();
      const rest = parts.slice(1).join('\n').trim();
      return {
        field: 'address',
        primaryLine,
        ...(rest ? { secondaryLine: rest } : {}),
      };
    }
    case '오는 길':
      return { field: 'directions', primaryLine: v.trim() };
    case '영업시간':
      return { field: 'hours', ...parseHoursLine(v) };
    case '전화번호':
      return { field: 'phone', phone: v.trim() };
    case '가격':
      return { field: 'price', line: v.trim() };
    case '인원':
      return { field: 'capacity', value: v.trim() };
    case '주차정보': {
      const { left, right } = splitParking(v);
      return right
        ? { field: 'parking', left, right }
        : { field: 'custom', label: '주차정보', value: v.trim() };
    }
    case '옵션가격':
      return { field: 'custom', label: '옵션가격', value: v.trim() };
    case '추가정보': {
      const trimmed = v.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        return { field: 'extra_link', href: trimmed, displayText: trimmed };
      }
      return { field: 'custom', label: '추가정보', value: v.trim() };
    }
    default:
      return { field: 'custom', label: row.label, value: v.trim() };
  }
}

/** 검색·홈 카드의 업체 → URL 슬러그 (룸 상세 업체 정보 링크용) */
export const VENDOR_SLUG_BY_STUDIO: Record<string, string> = {
  '서울스트리트퍼포먼스': 'seoul-street-performance',
  '업비트스튜디오': 'upbit-studio',
  '예쎄뮤직': 'yesse-music',
  '자하브합주실': 'jahahb',
  '프롬스튜디오': 'from-studio',
  '준사운드': 'jun-sound',
  '순스튜디오': 'soon-studio',
  '타수 음악연습실': 'tasu-practice',
  유스뮤직: 'youth-music',
  '방구석 뮤지션의 합주실': 'banggu-musician',
  챗츠뮤직: 'chats-music',
};

export type VendorRoomItem = {
  categoryLabel: string;
  detailPath: string;
  image: string;
  location: string;
  priceLabel: string;
  priceSuffix: string;
  rating: string;
  studioLabel: string;
  tags: string[];
  title: string;
};

export type VendorReviewItem = {
  author: string;
  authorAvatar?: string;
  date: string;
  photos?: string[];
  rating: number;
  roomName: string;
  roomThumb: string;
  text: string;
  visitLabel: string;
};

export type VendorDetailModel = {
  basicInfoRows: VendorBasicInfoRow[];
  description: string;
  distanceLabel: string;
  fullAddress: string;
  hashTags: string[];
  heroImage: string;
  mapImage: string;
  mapLocation: {
    lat: number;
    lng: number;
  };
  name: string;
  policyLinkLabel: string;
  reviewCountLabel: string;
  reviewSectionCount: number;
  reviews: VendorReviewItem[];
  rooms: VendorRoomItem[];
  timeNote: string;
};

const FIGMA_HERO =
  'https://www.figma.com/api/mcp/asset/1fd8a0e1-a266-4bd7-a5fb-2f7f28992266';
const FIGMA_MAP =
  'https://www.figma.com/api/mcp/asset/d658c906-1922-493d-8adf-ca70fef41622';
const ROOM_THUMB_A =
  'https://www.figma.com/api/mcp/asset/aa910e8b-35a9-4295-9f5e-7c97b2bc514f';
const ROOM_THUMB_A2 =
  'https://www.figma.com/api/mcp/asset/6bd447b2-a525-424d-8bcf-d86cee55284e';
const ROOM_THUMB_B =
  'https://www.figma.com/api/mcp/asset/7ad596f4-4c0a-4a2e-aaf6-c2cd80f6bb3a';
const REVIEW_PHOTO_1 =
  'https://www.figma.com/api/mcp/asset/5d925c86-001a-494a-aa0e-d5247da63f92';
const REVIEW_PHOTO_2 =
  'https://www.figma.com/api/mcp/asset/2d2bfe19-f753-44fc-aac6-8c507209ec5b';
const REVIEW_PHOTO_3 =
  'https://www.figma.com/api/mcp/asset/6a9e57cf-8224-4a37-a641-5a5c21ec02b3';

const YOUTH_VENDOR_DETAIL: VendorDetailModel = {
  description:
    '누구보다 몰입감 있는 사운드 환경을 갖춘 합주실입니다.\n밴드와 보컬, 개인 연습까지 모두 만족할 수 있는 음향과 장비를 준비했습니다.\n여러분이 연습에만 집중할 수 있도록 쾌적한 공간과 편안한 시설을 제공하기 위해 항상 최선을 다하겠습니다.\n찾아주시는 모든 분들이 즐겁게 머물 수 있는 합주 공간이 되도록 꾸준히 노력하겠습니다.',
  distanceLabel: '500m',
  fullAddress: '서울시 마포구 독막로9길 31 지하 1층',
  hashTags: ['#피아노', '#합주실', '#당일예약', '#24시'],
  heroImage: FIGMA_HERO,
  mapImage: FIGMA_MAP,
  mapLocation: { lat: 37.54853, lng: 126.92234 },
  name: '유스뮤직',
  policyLinkLabel: '이용정책 확인',
  reviewCountLabel: '48개의 리뷰',
  reviewSectionCount: 32,
  reviews: [
    {
      author: 'neowmeow',
      authorAvatar: 'https://www.figma.com/api/mcp/asset/d58e88a8-0cc1-4c91-91b0-56c544410c3e',
      date: '25.08.22',
      photos: [REVIEW_PHOTO_1, REVIEW_PHOTO_2, REVIEW_PHOTO_3],
      rating: 4.5,
      roomName: 'A룸 그랜드 피아노 대관',
      roomThumb: ROOM_THUMB_A,
      text:
        '합주실이 넓고 쾌적했어요. 특히 드럼 세트가 상태가 좋고, 방음도 잘 돼서 마음껏 연습할 수 있었습니다. 예약도 간편하고, 가격도 괜찮아요. 다만 주차 공간이 조금 부족한 점은 아쉬웠어요.',
      visitLabel: '1번째 방문',
    },
    {
      author: 'music_life',
      authorAvatar: 'https://www.figma.com/api/mcp/asset/62fdde3d-1a3a-4b86-9ac6-807e7acb529c',
      date: '25.08.22',
      rating: 4.5,
      roomName: 'A2룸 합주실(대형)',
      roomThumb: ROOM_THUMB_A2,
      text:
        '시설 상태가 정말 훌륭합니다. 음향 장비와 PA 시스템도 최신 모델이라 깔끔하게 소리가 잘 나고, 스튜디오 분위기도 너무 좋았어요. 예약할 때 응답도 빠르고 친절해서 만족스러웠습니다. 자주 이용할 것 같아요!',
      visitLabel: '3번째 방문',
    },
    {
      author: 'band_123',
      authorAvatar: 'https://www.figma.com/api/mcp/asset/ed034bc3-65c6-401b-8414-061a1a87569a',
      date: '25.08.22',
      rating: 4.5,
      roomName: 'B룸 보컬트레이닝 전용',
      roomThumb: ROOM_THUMB_B,
      text:
        '우와 여기 진짜 강추하고 싶은곳! 주변에 추천해달라고 하면 여기 추천해줄거 같아요! 친구들한테도 널리 알리는 중입니다 :)',
      visitLabel: '1번째 방문',
    },
    {
      author: '연습집중중',
      authorAvatar: 'https://www.figma.com/api/mcp/asset/399bb90f-35e6-44d6-b9ed-3b55e941038c',
      date: '25.08.22',
      rating: 4.5,
      roomName: 'A룸 그랜드 피아노 대관',
      roomThumb: ROOM_THUMB_A,
      text:
        '합주실이 꽤 넓고 장비 상태는 좋았지만, 시설 관리가 조금 부족한 것 같아요. 특히 에어컨이 잘 안 효율적으로 작동해서 더운 날에는 불편할 수 있었습니다. 그래도 가격 대비 괜찮은 선택입니다.',
      visitLabel: '2번째 방문',
    },
  ],
  rooms: [
    {
      categoryLabel: '유스뮤직',
      detailPath: '/spaces/a-room-grand-piano-rental',
      image: ROOM_THUMB_A,
      location: '서울 마포구 동교동',
      priceLabel: '10,000원',
      priceSuffix: '/60분',
      rating: '4.5',
      studioLabel: '유스뮤직',
      tags: ['주차가능', '예약가능'],
      title: 'A룸 그랜드 피아노 대관',
    },
    {
      categoryLabel: '유스뮤직',
      detailPath: '/spaces/jazz-ensemble-room',
      image: ROOM_THUMB_A2,
      location: '서울 마포구 동교동',
      priceLabel: '10,000원',
      priceSuffix: '/60분',
      rating: '4.5',
      studioLabel: '유스뮤직',
      tags: ['주차가능', '예약가능'],
      title: 'A2룸 합주실(대형)',
    },
    {
      categoryLabel: '유스뮤직',
      detailPath: '/spaces/yeongchang-upright-room',
      image: ROOM_THUMB_B,
      location: '서울 마포구 동교동',
      priceLabel: '10,000원',
      priceSuffix: '/60분',
      rating: '4.5',
      studioLabel: '유스뮤직',
      tags: ['주차가능', '예약가능'],
      title: 'B룸 보컬트레이닝 전용',
    },
  ],
  basicInfoRows: [
    {
      field: 'address',
      primaryLine: '서울시 마포구 독막로9길 31 지하 1층',
      secondaryLine: '상수역 1번 출구에서 563m',
    },
    { field: 'directions', primaryLine: '상수역 1번 출구에서 우측으로 이동 (푸글렌 서울)' },
    { field: 'hours', dayLabel: '수', hoursLine: '07:00 ~ 23:00' },
    { field: 'phone', phone: '0507-1111-1234' },
    { field: 'price', line: '09:00~17:00 : 10,000원/60분' },
    { field: 'capacity', value: '기본 2명 (최대 6명)' },
    { field: 'parking', left: '주차가능', right: '무료' },
    {
      displayText: 'http://www.instagram.com/usmusic',
      field: 'extra_link',
      href: 'http://www.instagram.com/usmusic',
    },
  ],
  timeNote: '최소 30분 단위로 선택',
};

function studioFromSlug(slug: string): string | null {
  const entry = Object.entries(VENDOR_SLUG_BY_STUDIO).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

const DEFAULT_BASIC_INFO_ROWS: VendorBasicInfoRow[] = [
  { field: 'address', primaryLine: '서울시 마포구 (상세 주소는 각 공간에서 확인)' },
  { field: 'hours', hoursLine: '07:00 ~ 23:00' },
  { field: 'phone', phone: '0507-1111-0000' },
];

function basicInfoRowsForStudio(studio: string): VendorBasicInfoRow[] {
  if (studio === '업비트스튜디오') {
    return ROOM_DETAIL_INFO_ROWS.map((row) => roomDetailRowToBasic(row));
  }
  return DEFAULT_BASIC_INFO_ROWS;
}

function buildAggregateVendor(slug: string, studio: string): VendorDetailModel {
  const cards = HOME_SPACE_CARDS.filter((c) => c.studio === studio);
  const heroImage = cards[0]?.image ?? FIGMA_HERO;
  const hashTags = [...SPACE_DETAIL_SUMMARY_HASH_TAGS];
  const fullAddress =
    studio === '업비트스튜디오' ? ROOM_DETAIL_DATA.address : `서울 (${cards[0]?.location ?? '등록 지역'})`;
  const distanceLabel = studio === '업비트스튜디오' ? '482m' : '—';

  const rooms: VendorRoomItem[] = cards.map((c) => ({
    categoryLabel: c.subtitle,
    detailPath: c.detailPath,
    image: c.image,
    location: c.location,
    priceLabel: `${c.price}`,
    priceSuffix: '/60분',
    rating: c.rating,
    studioLabel: studio,
    tags: ['주차가능', '예약가능'],
    title: c.title,
  }));

  const reviews: VendorReviewItem[] = ROOM_DETAIL_DATA.reviewSummary.slice(0, 4).map((r, i) => ({
    author: r.author,
    date: r.date.startsWith('20') ? r.date.slice(2) : r.date,
    photos: r.photoCount && i === 1 ? [REVIEW_PHOTO_1, REVIEW_PHOTO_2] : undefined,
    rating: Number.parseFloat(r.rating) || 5,
    roomName: cards[0]?.title ?? '대표 공간',
    roomThumb: cards[0]?.image ?? heroImage,
    text: r.text,
    visitLabel: `${i + 1}번째 방문`,
  }));

  return {
    description: `${studio}에서 운영 중인 연습·합주 공간입니다. 각 룸 상세에서 예약과 이용 안내를 확인해 주세요.`,
    distanceLabel,
    fullAddress,
    hashTags,
    heroImage,
    mapImage: FIGMA_MAP,
    mapLocation: { lat: 37.5562, lng: 126.9229 },
    name: studio,
    policyLinkLabel: '이용정책 확인',
    reviewCountLabel: `${ROOM_DETAIL_DATA.reviewCount}개의 리뷰`,
    reviewSectionCount: Math.min(32, ROOM_DETAIL_DATA.reviewCount),
    reviews,
    rooms,
    basicInfoRows: basicInfoRowsForStudio(studio),
    timeNote: '최소 30분 단위로 선택',
  };
}

function staticSearchVendor(name: string): VendorDetailModel {
  return {
    description:
      `${name}의 공간 정보입니다. 아래에서 등록된 룸을 확인하고 상세 페이지에서 예약할 수 있습니다.`,
    distanceLabel: '350m',
    fullAddress: '서울시 마포구 합정동 인근',
    hashTags: ['#합주실', '#연습실', '#당일예약'],
    heroImage: FIGMA_HERO,
    mapImage: FIGMA_MAP,
    mapLocation: { lat: 37.5509, lng: 126.9144 },
    name,
    policyLinkLabel: '이용정책 확인',
    reviewCountLabel: '12개의 리뷰',
    reviewSectionCount: 12,
    reviews: YOUTH_VENDOR_DETAIL.reviews.slice(0, 2),
    rooms: [],
    basicInfoRows: DEFAULT_BASIC_INFO_ROWS,
    timeNote: '최소 30분 단위로 선택',
  };
}

export function getVendorDetail(slug: string | undefined): VendorDetailModel | null {
  if (!slug) {
    return null;
  }

  if (slug === 'youth-music') {
    return YOUTH_VENDOR_DETAIL;
  }

  if (slug === 'banggu-musician') {
    return staticSearchVendor('방구석 뮤지션의 합주실');
  }

  if (slug === 'chats-music') {
    return staticSearchVendor('챗츠뮤직');
  }

  const studio = studioFromSlug(slug);
  if (!studio) {
    return null;
  }

  return buildAggregateVendor(slug, studio);
}

export function getVendorSlugForStudio(studio: string): string | null {
  return VENDOR_SLUG_BY_STUDIO[studio] ?? null;
}
