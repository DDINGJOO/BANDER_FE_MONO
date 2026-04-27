/**
 * Figma 6419:83358 (FAQ) / 6419:83508 (FAQ 펼치기) / 6419:83454 (1:1 문의 목록)
 *       / 6419:85757 (답변대기 상세) / 6419:85508 (답변완료 상세)
 *       / 6419:85915 / 6419:86048 (1:1 문의 폼 + 입력 상태)
 * 서버 연동 시 대체 대상:
 *   - FAQ: GET /api/v1/support/faq?category=
 *   - 1:1 문의 목록: GET /api/v1/users/me/inquiries
 *   - 1:1 문의 상세: GET /api/v1/users/me/inquiries/{id}
 *   - 1:1 문의 등록: POST /api/v1/inquiries
 */

export type FaqCategory = '예약 관련' | '이용/입실' | '요금/결제' | '리뷰/신고' | '기타';
export type FaqFilter = 'ALL' | FaqCategory;

export type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answerParagraphs: string[];
  answerBullets?: string[];
};

export type InquiryStatus = 'WAITING' | 'ANSWERED';

export type InquiryListItem = {
  id: string;
  category: '서비스 이용' | '예약 관련' | '요금/결제' | '기타';
  title: string;
  dateLabel: string;
  status: InquiryStatus;
};

export type InquiryDetail = InquiryListItem & {
  body: string;
  imageUrls?: string[];
  answer?: {
    body: string;
    dateLabel: string;
  };
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: '예약 관련',
    question: '공간은 어떻게 예약하나요?',
    answerParagraphs: [
      '원하는 공간의 상세 페이지에서 날짜와 시간을 선택한 뒤 예약하기 버튼을 눌러주세요. 결제까지 마쳐야 예약이 확정됩니다.',
    ],
  },
  {
    id: 'faq-2',
    category: '예약 관련',
    question: '예약을 취소하거나 변경하고 싶어요.',
    answerParagraphs: [
      '내 예약 > 예약 상세에서 취소 및 일정 변경이 가능합니다. 업체별 환불 규정에 따라 차이가 있을 수 있어요.',
    ],
  },
  {
    id: 'faq-3',
    category: '예약 관련',
    question: '예약 확정은 어떻게 알 수 있나요?',
    answerParagraphs: [
      '예약이 완료되면 마이페이지 > 내 예약 화면에서 확정 여부를 확인할 수 있어요.',
    ],
    answerBullets: [
      '예약이 즉시 확정되는 공간의 경우, 결제가 완료되면 바로 "예약 확정" 상태로 표시됩니다.',
      '호스트 승인이 필요한 공간은 예약 후 일정 시간이 지난 뒤, "승인 대기" → "예약 확정"으로 상태가 변경됩니다.',
      '확정된 예약은 문자 또는 앱 알림으로도 안내해드려요.',
    ],
  },
  {
    id: 'faq-4',
    category: '예약 관련',
    question: '현장 결제도 가능한가요?',
    answerParagraphs: [
      '대부분의 공간은 예약 시점에 온라인 결제로 확정됩니다. 현장 결제를 허용하는 업체는 상세 페이지의 결제 정책에서 확인할 수 있습니다.',
    ],
  },
  {
    id: 'faq-5',
    category: '이용/입실',
    question: '입실 시간이 지났는데 입장이 안돼요.',
    answerParagraphs: [
      '입실 지연이 발생한 경우 업체 연락처로 먼저 연락 후, 해결되지 않으면 고객센터로 문의해주세요.',
    ],
  },
  {
    id: 'faq-6',
    category: '이용/입실',
    question: '추가요금은 언제 발생하나요?',
    answerParagraphs: [
      '예약 시간을 초과해 이용하거나, 선택한 옵션이 포함되지 않은 부가 장비를 사용할 경우 추가요금이 발생할 수 있어요.',
    ],
  },
  {
    id: 'faq-7',
    category: '요금/결제',
    question: '추가요금은 언제 발생하나요?',
    answerParagraphs: [
      '현장에서 연장한 시간, 추가 인원, 유료 장비 사용 등은 현장 결제로 정산됩니다.',
    ],
  },
];

export const INQUIRY_LIST: InquiryListItem[] = [
  {
    id: 'inq-1',
    category: '서비스 이용',
    title: '채팅에 답변이 계속 없어요.',
    dateLabel: '25.08.10 14:20',
    status: 'ANSWERED',
  },
  {
    id: 'inq-2',
    category: '서비스 이용',
    title: '해당 공간에 제대로 예약이 됐는지 확인하고 싶어요.',
    dateLabel: '25.08.10 14:20',
    status: 'WAITING',
  },
];

export const INQUIRY_DETAILS: Record<string, InquiryDetail> = {
  'inq-1': {
    ...INQUIRY_LIST[0],
    body:
      '‘체리타운’ 업체에 공간을 보고 채팅을 걸었는데 계속 답변이 없습니다. 해당 업체가 어떻게 상황이 되고 있는지 확인부탁드려요! 너무너무 궁금해요!',
    answer: {
      body:
        '회원님, 먼저 저희 서비스를 이용해주셨는데 불편사항이 생긴 부분 죄송하게 생각합니다. 해당 업체와의 채팅내역을 캡쳐 후 다시 접수해주시면 해당 내용 확인 후 다시 연락드리도록 하겠습니다. 감사합니다.',
      dateLabel: '23.08.07 14:20',
    },
  },
  'inq-2': {
    ...INQUIRY_LIST[1],
    body:
      '해당 공간에 제대로 예약이 됐는지 확인하고 싶어요.\n어디서 확인하면 될까요?',
    imageUrls: [
      'https://www.figma.com/api/mcp/asset/411f1b35-ffaf-7de2-8231-a7cf8a3a9c42',
    ],
  },
};

export function getInquiryDetail(id: string): InquiryDetail | null {
  return INQUIRY_DETAILS[id] ?? null;
}

export const INQUIRY_CATEGORIES: readonly string[] = [
  '서비스 이용',
  '예약 관련',
  '요금/결제',
  '기타',
];
