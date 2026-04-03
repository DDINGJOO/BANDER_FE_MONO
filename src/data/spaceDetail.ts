import type { SpaceNoticeItem, SpacePricingLine } from '../types/space';
import { HOME_SPACE_CARDS } from './home';

/** Figma 룸 상세(6071:32854) 지도 검색 입력 플레이스홀더 */
export const SPACE_DETAIL_MAP_SEARCH_PLACEHOLDER = '원하는 장소를 검색해보세요.';

/** 메인 컬럼 안내 배너 (Figma: 착한 가격…) */
export const SPACE_DETAIL_TRUST_BANNER = '착한 가격, 믿을만한 곳';

export const SPACE_DETAIL_PRICING_LINES: SpacePricingLine[] = [
  { label: '이용금액', value: '10분 1,000원' },
  { label: '야간·주말', value: '10분 1,200원' },
];

export const SPACE_DETAIL_OPERATING_SUMMARY = '오늘(금) 06:00 - 23:00';

/** 역에서 도보 거리 배지 (Figma 메타) */
export const SPACE_DETAIL_STATION_DISTANCE = '200m';

/** 주소 카드 보조 줄 (Figma: 상수역 … 563m) */
export const SPACE_DETAIL_ADDRESS_TRANSIT = '상수역 1번 출구에서 563m';

export const SPACE_DETAIL_NOTICES: SpaceNoticeItem[] = [
  {
    body: '그랜드 피아노 음량은 22시 이후 조절 부탁드립니다. 음식물은 냄새가 적은 간단한 스낵만 가능합니다.',
    title: '이용 안내',
  },
];

export const ROOM_DETAIL_DATA = {
  address: '서울시 마포구 독막로9길 31 지하 1층',
  category: '합주실',
  description:
    '유스뮤직의 그랜드 피아노를 보유한 룸입니다. 최고 사양의 그랜드 피아노와 완벽한 방음, 쾌적한 실내로 유스뮤직을 즐겨주세요! 유스뮤직의 그랜드 피아노를 보유한 룸입니다. 최고 사양의 그랜드 피아노와 완벽한 방음, 쾌적한 실내로 유스뮤직을 즐겨주세요!',
  gallery: [
    'https://www.figma.com/api/mcp/asset/faf24acb-5b97-4dc9-b496-b8cfd2bf7e18',
    'https://www.figma.com/api/mcp/asset/dbac413c-ce1b-4204-8349-58d93f3e31cb',
    'https://www.figma.com/api/mcp/asset/c1c89983-892a-473c-893f-8018ed149c33',
    'https://www.figma.com/api/mcp/asset/890bf1d4-4704-428f-8db7-e76f9adf6a27',
    'https://www.figma.com/api/mcp/asset/34569b09-a2a7-4e61-8869-29c0db88dc25',
  ],
  location: '서울 마포구 동교동',
  policies: [
    {
      body:
        '입장 10분 전부터 입실이 가능합니다. 공간 내부에서는 실내화를 착용해 주세요. 다음 사용자를 위해 퇴실 전 간단한 정리와 장비 위치 복구를 부탁드립니다. 음식물 반입은 냄새가 적고 간단한 스낵 위주로만 가능합니다.',
      title: '유의사항',
    },
    {
      body:
        '기본 수용 인원은 2명이며 최대 6명까지 이용할 수 있습니다. 외부 악기 반입 가능하며, 추가 장비 사용 시 옵션 금액이 발생할 수 있습니다. 당일 예약도 가능하지만 운영 시간 내에서만 승인됩니다.',
      title: '이용 안내',
    },
    {
      body:
        '예약 취소는 이용 시작 24시간 전까지 가능합니다. 예약 확정 이후 시간 변경은 채팅 문의를 통해 조율해 주세요. 현장 상황에 따라 일부 장비 구성은 변경될 수 있습니다.',
      title: '환불 및 변경',
    },
  ],
  priceLabel: '10,000원~',
  rating: '5.0',
  reviewCount: 412,
  reviewSummary: [
    {
      author: 'neowmeow',
      date: '2025.02.27',
      rating: '4.8',
      text:
        '피아노 상태가 좋고 방음도 안정적이어서 연습에 집중하기 좋았습니다. 관리가 깔끔하고 조명도 편안해서 재방문 의사가 있어요.',
    },
    {
      author: 'BandSoul33',
      date: '2025.02.20',
      rating: '4.9',
      text:
        '시설 설명과 실제 상태 차이가 거의 없었고, 예약 응답도 빨랐습니다. 장비 컨디션이 좋아 합주 리허설용으로 추천할 만합니다.',
    },
    {
      author: 'mellowkeys',
      date: '2025.02.12',
      rating: '4.8',
      text:
        '그랜드 피아노 터치감이 좋았고 실내 소음도 적었습니다. 위치도 접근성이 괜찮아서 다음에도 같은 룸으로 예약하고 싶습니다.',
    },
  ],
  studioName: '유스뮤직',
  summaryTags: ['주차가능', '예약가능', '냉난방', '와이파이'],
  title: 'A룸 그랜드 피아노 대관',
  vendor: {
    name: '유스뮤직',
    spaces: '15개의 공간',
  },
  descriptionCategoryLabel: '전체',
};

export const ROOM_DETAIL_INFO_ROWS = [
  {
    label: '주소',
    value: '서울시 마포구 독막로9길 31 지하 1층\n상수역 1번 출구에서 563m',
  },
  { label: '오는 길', value: '상수역 1번 출구에서 우측으로 이동 (푸글렌 서울)' },
  { label: '영업시간', value: '오늘(금) 06:00 - 23:00' },
  { label: '전화번호', value: '0507-1111-1234' },
  { label: '가격', value: '09:00~17:00 : 10,000원/60분' },
  { label: '인원', value: '기본 2명 (최대 6명)' },
  { label: '주차정보', value: '주차가능 · 무료' },
  { label: '옵션가격', value: 'Guitar 추가 5,000원 / Piano 추가 5,000원 / 인원 추가 5,000원' },
  { label: '추가정보', value: 'http://www.instagram.com/usmusic' },
] as const;

export const ROOM_DETAIL_RECOMMENDATIONS = HOME_SPACE_CARDS.slice(0, 4);
