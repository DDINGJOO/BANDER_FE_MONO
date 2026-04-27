/**
 * Figma 6419:83665 (공지사항 탭) / 6419:83913 (이벤트 탭) / 6419:83750, 6419:83798, 6419:85256 (공지상세 3종)
 * 서버 연동 시 대체 대상 예시:
 *   - 목록:  GET /api/v1/notices?tab=NOTICE|EVENT&category=&page=
 *   - 상세:  GET /api/v1/notices/{slug}
 */

export type NoticeTab = 'NOTICE' | 'EVENT';

export type NoticeCategory = '공지' | '업데이트' | '정보' | '기타';

export type EventStatus = '진행중' | '종료';

export type NoticeBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'bullet'; items: string[] }
  | { kind: 'winners'; title: string; message?: string; rows: { rank: string; masked: string }[] };

export type NoticeListItem = {
  id: string;
  slug: string;
  tab: NoticeTab;
  /** NOTICE 탭에서만 사용 */
  category?: NoticeCategory;
  /** EVENT 탭에서만 사용 */
  status?: EventStatus;
  dDayLabel?: string;
  title: string;
  dateLabel: string;
};

export type NoticeDetail = {
  id: string;
  slug: string;
  tab: NoticeTab;
  category?: NoticeCategory;
  status?: EventStatus;
  dDayLabel?: string;
  kickerLabel?: string;
  title: string;
  dateLabel: string;
  thumbnailUrl?: string;
  blocks: NoticeBlock[];
  prev?: { slug: string; title: string; dateLabel: string } | null;
  next?: { slug: string; title: string; dateLabel: string } | null;
};

export const NOTICE_LIST: NoticeListItem[] = [
  {
    id: 'n-1',
    slug: 'privacy-policy-2025-08',
    tab: 'NOTICE',
    category: '공지',
    title: '개인정보 처리방침 개정안내',
    dateLabel: '25.08.10 14:20',
  },
  {
    id: 'n-2',
    slug: 'ios-update',
    tab: 'NOTICE',
    category: '업데이트',
    title: 'iOS 오류 업데이트 안내',
    dateLabel: '25.08.10 14:20',
  },
  {
    id: 'n-3',
    slug: 'long-inactive-path',
    tab: 'NOTICE',
    category: '기타',
    title: '장기 미 접속자 경로 비활성화 안내 사항',
    dateLabel: '25.08.10 14:20',
  },
  {
    id: 'n-4',
    slug: 'how-to-use-bander',
    tab: 'NOTICE',
    category: '정보',
    title: '밴더 사용법',
    dateLabel: '25.08.10 14:20',
  },
];

export const EVENT_LIST: NoticeListItem[] = [
  {
    id: 'e-1',
    slug: 'self-cam-challenge',
    tab: 'EVENT',
    status: '진행중',
    dDayLabel: 'D-30',
    title: '내 공간 셀프캠 챌린지 🎥',
    dateLabel: '25.08.10 14:20',
  },
  {
    id: 'e-2',
    slug: 'review-coffee-coupon',
    tab: 'EVENT',
    status: '진행중',
    dDayLabel: 'D-30',
    title: '리뷰 쓰면 커피 쿠폰이?! ☕',
    dateLabel: '25.08.10 14:20',
  },
  {
    id: 'e-3',
    slug: 'guitar-user-support',
    tab: 'EVENT',
    status: '진행중',
    dDayLabel: 'D-30',
    title: '🎸기타 유저 집중 지원 이벤트!',
    dateLabel: '25.08.10 14:20',
  },
  {
    id: 'e-4',
    slug: 'refer-bander-gift',
    tab: 'EVENT',
    status: '종료',
    title: '밴더 소문내고 선물받기',
    dateLabel: '25.08.10 14:20',
  },
];

const NOTICE_DETAIL_BLOCKS = [
  {
    kind: 'paragraph' as const,
    text: `안녕하세요. 밴더입니다.

이번달 8월부터 개인정보 처리방침이 재개정되어 안내 드립니다. 업데이트 사항은 내정보 > 약관정보에서 확인하실 수 있으며 밴더는 여러분의 안전한 개인정보 보호를 위해 더욱 노력하겠습니다.

감사합니다.`,
  },
];

const SELF_CAM_BLOCKS: NoticeBlock[] = [
  { kind: 'paragraph', text: '밴더에서 연습하고, 나만의 순간을 공유해 주세요!' },
  { kind: 'heading', text: '📌 참여 방법' },
  {
    kind: 'bullet',
    items: [
      '1. 밴더에서 공간 예약 후, 연습 또는 녹음하는 모습을 영상으로 촬영',
      '2. 자신의 인스타그램 또는 틱톡 계정에 업로드',
      '3. 필수 해시태그와 함께 게시 [#밴더셀프캠 #밴더챌린지 #내공간내무드]',
      '4. 밴더 공식 이메일로 해당 캡쳐 내용 제출 → bander@gmail.com',
    ],
  },
  { kind: 'heading', text: '🎁 이벤트 경품' },
  {
    kind: 'bullet',
    items: [
      '1등(1명): 에어팟 프로 or 동급 음향기기',
      '2등(3명): 밴더 30,000원 이용 쿠폰',
      '참가자 전원: 10% 할인 쿠폰 지급',
    ],
  },
  { kind: 'heading', text: '🗓️ 이벤트 기간' },
  {
    kind: 'bullet',
    items: [
      '참여 기간: 2025.09.15 ~ 2025.09.30',
      '당첨자 발표: 2025.10.05 (앱 공지사항 및 개별 DM 안내)',
    ],
  },
  { kind: 'heading', text: '✅ 유의사항' },
  {
    kind: 'bullet',
    items: [
      '공개 계정으로 업로드된 게시물만 인정됩니다.',
      '이벤트 목적에 적합하지 않거나, 타인의 콘텐츠를 도용한 경우 참여가 무효 처리될 수 있습니다.',
      '게시된 콘텐츠는 밴더의 마케팅 콘텐츠로 활용될 수 있습니다. (동의 필수)',
    ],
  },
];

const REFER_BANDER_BLOCKS: NoticeBlock[] = [
  {
    kind: 'paragraph',
    text: '당신만 알고 있긴 아까운 밴더, 친구에게 소문내고 선물 받아가세요! 🎁',
  },
  { kind: 'paragraph', text: '밴더를 SNS에 공유만 해도 참여 완료! 추첨을 통해 푸짐한 경품을 드립니다!' },
  { kind: 'heading', text: '📌 참여 방법' },
  {
    kind: 'bullet',
    items: [
      '1. SNS(인스타그램, X, 블로그, 커뮤니티 등)에 밴더를 소개',
      '   사용 후기 / 추천 이유 / 캡처 이미지 등 자유롭게 작성',
      '2. 아래 필수 해시태그 포함 [#밴더추천 #연습실추천 #밴더이벤트]',
      '3. 밴더 공식 이메일로 해당 캡쳐 내용 제출 → bander@gmail.com',
    ],
  },
  { kind: 'heading', text: '🎁 이벤트 경품' },
  {
    kind: 'bullet',
    items: [
      '1등(1명): 에어팟 프로 or 동급 음향기기',
      '2등(3명): 밴더 30,000원 이용 쿠폰',
      '참가자 전원: 10% 할인 쿠폰 지급',
    ],
  },
  { kind: 'heading', text: '🗓️ 이벤트 기간' },
  {
    kind: 'bullet',
    items: [
      '참여 기간: 2025.09.15 ~ 2025.09.30',
      '당첨자 발표: 2025.10.05 (앱 공지사항 및 개별 DM 안내)',
    ],
  },
  { kind: 'heading', text: '✅ 유의사항' },
  {
    kind: 'bullet',
    items: [
      '공개 계정으로 업로드된 게시물만 인정됩니다.',
      '이벤트 목적에 적합하지 않거나, 타인의 콘텐츠를 도용한 경우 참여가 무효 처리될 수 있습니다.',
      '게시된 콘텐츠는 밴더의 마케팅 콘텐츠로 활용될 수 있습니다. (동의 필수)',
    ],
  },
  {
    kind: 'winners',
    title: '당첨자 발표',
    message: '당첨을 축하합니다!',
    rows: [
      { rank: '(1등) 해피트리', masked: 'kd*****@gmail.com' },
      { rank: '(2등) 밴더신입자', masked: 'df*****@naver.com' },
      { rank: '(2등) 밴더밴더123', masked: 'lu*****@gmail.com' },
    ],
  },
];

const EVENT_THUMB =
  'https://www.figma.com/api/mcp/asset/7b4a7676-b60c-5c94-a61a-88f09640d08f';
const NOTICE_THUMB =
  'https://www.figma.com/api/mcp/asset/aa910e8b-35a9-4295-9f5e-7c97b2bc514f';

const ALL_LIST_ITEMS: NoticeListItem[] = [...NOTICE_LIST, ...EVENT_LIST];

function findAdjacent(slug: string, items: NoticeListItem[]): {
  prev?: { slug: string; title: string; dateLabel: string } | null;
  next?: { slug: string; title: string; dateLabel: string } | null;
} {
  const idx = items.findIndex((r) => r.slug === slug);
  if (idx < 0) return { prev: null, next: null };
  const prev = idx > 0 ? items[idx - 1] : null;
  const next = idx < items.length - 1 ? items[idx + 1] : null;
  return {
    prev: prev ? { slug: prev.slug, title: prev.title, dateLabel: prev.dateLabel } : null,
    next: next ? { slug: next.slug, title: next.title, dateLabel: next.dateLabel } : null,
  };
}

function synthesizeDetail(row: NoticeListItem): NoticeDetail {
  const siblings = row.tab === 'NOTICE' ? NOTICE_LIST : EVENT_LIST;
  const { prev, next } = findAdjacent(row.slug, siblings);
  return {
    id: row.id,
    slug: row.slug,
    tab: row.tab,
    category: row.category,
    status: row.status,
    dDayLabel: row.dDayLabel,
    title: row.title,
    dateLabel: row.dateLabel,
    thumbnailUrl: row.tab === 'EVENT' ? EVENT_THUMB : NOTICE_THUMB,
    blocks: [
      {
        kind: 'paragraph',
        text: '안녕하세요. 밴더입니다.\n상세 내용은 업데이트 예정입니다. 불편을 드려 죄송합니다.',
      },
    ],
    prev,
    next,
  };
}

/**
 * 상세 slug가 NOTICE_DETAILS 에 등록되지 않아도 목록 메타로부터 안전하게 stub을 합성한다.
 * 실제 서버 연동 이후에는 이 fallback을 제거하고 404 처리로 바꿀 것.
 */
export function getNoticeDetail(slug: string): NoticeDetail | null {
  const explicit = NOTICE_DETAILS[slug];
  if (explicit) return explicit;
  const row = ALL_LIST_ITEMS.find((r) => r.slug === slug);
  if (!row) return null;
  return synthesizeDetail(row);
}

export const NOTICE_DETAILS: Record<string, NoticeDetail> = {
  'privacy-policy-2025-08': {
    id: 'n-1',
    slug: 'privacy-policy-2025-08',
    tab: 'NOTICE',
    category: '공지',
    title: '개인정보 처리방침 개정안내',
    dateLabel: '25.08.10 14:20',
    thumbnailUrl: NOTICE_THUMB,
    blocks: NOTICE_DETAIL_BLOCKS,
    prev: { slug: 'ios-update', title: 'iOS 오류 업데이트 안내', dateLabel: '26.02.23' },
    next: {
      slug: 'long-inactive-path',
      title: '장기 미 접속자 경로 비활성화 안내 사항',
      dateLabel: '26.02.23',
    },
  },
  'self-cam-challenge': {
    id: 'e-1',
    slug: 'self-cam-challenge',
    tab: 'EVENT',
    status: '진행중',
    dDayLabel: 'D-30',
    kickerLabel: 'EVENT',
    title: '내 공간 셀프캠 챌린지 🎥',
    dateLabel: '25.08.10 14:20',
    thumbnailUrl: EVENT_THUMB,
    blocks: SELF_CAM_BLOCKS,
    prev: { slug: 'review-coffee-coupon', title: '리뷰 쓰면 커피 쿠폰이?! ☕', dateLabel: '26.02.23' },
    next: {
      slug: 'guitar-user-support',
      title: '🎸기타 유저 집중 지원 이벤트!',
      dateLabel: '26.02.23',
    },
  },
  'refer-bander-gift': {
    id: 'e-4',
    slug: 'refer-bander-gift',
    tab: 'EVENT',
    status: '종료',
    title: '밴더 소문내고 선물받기',
    dateLabel: '25.08.10 14:20',
    thumbnailUrl: EVENT_THUMB,
    blocks: REFER_BANDER_BLOCKS,
    prev: { slug: 'review-coffee-coupon', title: '리뷰 쓰면 커피 쿠폰이?! ☕', dateLabel: '26.02.23' },
    next: {
      slug: 'guitar-user-support',
      title: '🎸기타 유저 집중 지원 이벤트!',
      dateLabel: '26.02.23',
    },
  },
};
