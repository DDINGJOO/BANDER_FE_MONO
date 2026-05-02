/** 백엔드 계약: {@link import('./schemas/space').SpaceDetailResponseDto} — GET /api/v1/spaces/{slug} */
import type {
  SpaceDetailBenefitItem,
  SpaceNoticeItem,
  SpaceOperatingDay,
  SpacePricingLine,
} from '../types/space';
import { HOME_SPACE_CARDS } from './home';

/** 메인 컬럼 안내 배너 (Figma: 착한 가격…) */
export const SPACE_DETAIL_TRUST_BANNER = '착한 가격, 믿을만한 곳';

export const SPACE_DETAIL_PRICING_LINES: SpacePricingLine[] = [
  { label: '이용금액', value: '10분 1,000원' },
  { label: '야간·주말', value: '10분 1,200원' },
];

/** Figma 6071:32916 — 상단 요약 해시태그 행 */
export const SPACE_DETAIL_SUMMARY_HASH_TAGS = ['#피아노', '#합주실', '#당일예약', '#24시'] as const;

/** Figma 6372:36353 — 요약 영역 쿠폰 진입 바 (룸 상세 메인 프레임) */
export const SPACE_DETAIL_COUPON_STRIP_LABEL = '적용 가능 쿠폰 3';

/** Figma 6071:32908 — 별점 행 우측 가격 보조 텍스트 */
export const SPACE_DETAIL_SUMMARY_PRICE_SUFFIX = '/60분';

export const SPACE_DETAIL_OPERATING_SUMMARY = '오늘(금) 06:00 - 23:00';

/** 화살표 펼침 시 요일별 운영시간 (요약·업체 카드 공통) */
export const SPACE_DETAIL_OPERATING_WEEK: SpaceOperatingDay[] = [
  { hours: '06:00 - 23:00', weekday: '월' },
  { hours: '06:00 - 23:00', weekday: '화' },
  { hours: '07:00 - 23:00', weekday: '수' },
  { hours: '06:00 - 23:00', weekday: '목' },
  { hours: '06:00 - 23:00', isToday: true, weekday: '금' },
  { hours: '08:00 - 22:00', weekday: '토' },
  { hours: '휴무', weekday: '일' },
];

/** 역에서 도보 거리 배지 — 기본 정보 주소 보조 줄과 동일 수치 */
export const SPACE_DETAIL_STATION_DISTANCE = '482m';

/** 주소 카드 보조 줄 — 요약 `482m` 배지·기본정보 주소 2행과 동일 문구 */
export const SPACE_DETAIL_ADDRESS_TRANSIT = '홍대입구역 9번 출구에서 482m';

const ROOM_DETAIL_STREET_ADDRESS = '서울시 마포구 동교로12길 24 지하 1층';

/** 기본 정보 — 지도 아래 4칩 (예시 카드와 동일 문구) */
export const SPACE_DETAIL_FACILITY_CHIPS: SpaceDetailBenefitItem[] = [
  { key: 'parking', label: '주차가능' },
  { key: 'booking', label: '예약가능' },
  { key: 'hvac', label: '냉난방' },
  { key: 'wifi', label: '와이파이' },
];

/** Figma 6071:33033 — 상세정보 혜택 6칩 (디자인 문구 그대로) */
export const SPACE_DETAIL_DETAIL_STRIP: SpaceDetailBenefitItem[] = [
  { label: '커피' },
  { key: 'wifi', label: '인터넷' },
  { label: '고속충전기' },
  { label: '모니터' },
  { label: '정수기' },
  { key: 'parking', label: '주차가능' },
];

export const SPACE_DETAIL_NOTICES: SpaceNoticeItem[] = [
  {
    body: '그랜드 피아노 음량은 22시 이후 조절 부탁드립니다. 음식물은 냄새가 적은 간단한 스낵만 가능합니다.',
    title: '이용 안내',
    imageUrl: null,
  },
];

/** `{{STUDIO}}`는 목록 카드의 스튜디오명으로 치환 (예시 페이지 카피 통일) */
export const ROOM_DETAIL_DATA = {
  address: ROOM_DETAIL_STREET_ADDRESS,
  category: '합주실',
  description:
    '{{STUDIO}}의 그랜드 피아노를 보유한 룸입니다. 최고 사양의 그랜드 피아노와 완벽한 방음, 쾌적한 실내에서 연습과 합주를 즐겨 주세요!',
  gallery: [
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508780709619-79562169bc64?auto=format&fit=crop&w=1200&q=80',
  ],
  location: '서울 마포구 서교동',
  mapLocation: { lat: 37.55678, lng: 126.92492 },
  policies: [
    {
      body:
        '입장 10분 전부터 입실이 가능합니다.\n공간 내부에서는 실내화를 착용해 주세요.\n다음 사용자를 위해 퇴실 전 간단한 정리와 장비 위치 복구를 부탁드립니다.\n음식물 반입은 냄새가 적고 간단한 스낵 위주로만 가능합니다.',
      title: '시설 안내',
      imageUrl: null,
    },
    {
      body:
        '기본 수용 인원은 2명이며 최대 6명까지 이용할 수 있습니다.\n외부 악기 반입 가능하며, 추가 장비 사용 시 옵션 금액이 발생할 수 있습니다.\n당일 예약도 가능하지만 운영 시간 내에서만 승인됩니다.',
      title: '예약 시 주의사항',
      imageUrl: null,
    },
    {
      body:
        '예약 취소는 이용 시작 24시간 전까지 가능합니다.\n예약 확정 이후 시간 변경은 채팅 문의를 통해 조율해 주세요.\n현장 상황에 따라 일부 장비 구성은 변경될 수 있습니다.',
      title: '환불규정 안내',
      imageUrl: null,
    },
  ],
  priceLabel: '10,000원~',
  rating: '5.0',
  reviewCount: 412,
  reviewSummary: [
    {
      author: 'mixlab',
      date: '2025.02.08',
      rating: '5.0',
      text:
        '장비 구성이 명확해서 합주 리허설용으로 좋았습니다. 다음에도 같은 공간으로 재예약할 예정입니다.',
    },
    {
      author: 'neowmeow',
      date: '2025.02.27',
      photoCount: 3,
      rating: '4.8',
      text:
        '그랜드 피아노 터치감과 방음이 좋아서 마음껏 연습할 수 있었어요. 예약도 간편하고 가격 대비 만족스러웠습니다. 주차 공간이 조금 아쉬웠어요.',
    },
    {
      author: 'mellowkeys',
      date: '2025.02.12',
      rating: '4.8',
      text:
        '그랜드 피아노 터치감이 좋았고 실내 소음도 적었습니다. 위치도 접근성이 괜찮아서 다음에도 같은 룸으로 예약하고 싶습니다.',
    },
  ],
  studioName: '업비트스튜디오',
  title: 'A룸 그랜드 피아노 대관',
  vendor: {
    name: '업비트스튜디오',
    spaces: '15개의 공간',
  },
  descriptionCategoryLabel: '전체',
};

export const ROOM_DETAIL_INFO_ROWS = [
  {
    label: '주소',
    value: `${ROOM_DETAIL_STREET_ADDRESS}\n${SPACE_DETAIL_ADDRESS_TRANSIT}`,
  },
  { label: '오는 길', value: '홍대입구역 9번 출구에서 연트럴파크 방면 도보 7분' },
  { label: '영업시간', value: '07:00 ~ 23:00' },
  { label: '전화번호', value: '0507-1111-1234' },
  { label: '가격', value: '09:00~17:00 : 10,000원/60분' },
  { label: '인원', value: '기본 2명 (최대 6명)' },
  { label: '주차정보', value: '주차가능 · 무료' },
  { label: '옵션가격', value: 'Guitar 추가 5,000원 / Piano 추가 5,000원 / 인원 추가 5,000원' },
  { label: '추가정보', value: 'http://www.instagram.com/usmusic' },
] as const;

export const ROOM_DETAIL_RECOMMENDATIONS = HOME_SPACE_CARDS.slice(0, 4);
