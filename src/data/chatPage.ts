/**
 * Figma 6406:77292 채팅 · 6435:27960 빈 상태
 */

import type { ChatMessageResponse, ChatRoomResponse } from '../api/chat';

export type ChatThread = {
  id: string;
  title: string;
  preview: string;
  timeLabel: string;
  unread?: number;
  unreadOverflow?: boolean;
};

export type ChatMessage =
  | {
      id: string;
      kind: 'in';
      senderName: string;
      text: string;
      time: string;
    }
  | {
      id: string;
      kind: 'out';
      /** 한 줄 또는 여러 줄(6406:77747) */
      lines: string[];
      time: string;
    };

export type ChatVendorPanel = {
  name: string;
  /** Figma: 완료 3, 취소 1 */
  statusLine: string;
  stats: { label: string; value: string }[];
  /** 레거시/다른 업체용 — 비우면 UI에서 숨김 */
  addressLine?: string;
  ratingLabel?: string;
  description?: string;
  tags?: string[];
};

const DEFAULT_VENDOR_KEY = '__default__';

const VENDOR_PANELS: Record<string, ChatVendorPanel> = {
  [DEFAULT_VENDOR_KEY]: {
    name: '제이니',
    statusLine: '완료 3, 취소 1',
    stats: [
      { label: '총 예약', value: '3건' },
      { label: '총 결제금액', value: '60,000원' },
      { label: '리뷰 내역', value: '3건' },
    ],
  },
  'youth-music': {
    name: '제이니',
    statusLine: '완료 3, 취소 1',
    stats: [
      { label: '총 예약', value: '3건' },
      { label: '총 결제금액', value: '60,000원' },
      { label: '리뷰 내역', value: '3건' },
    ],
  },
  'chats-music': {
    name: '챗츠뮤직',
    statusLine: '완료 1, 취소 0',
    stats: [
      { label: '총 예약', value: '2건' },
      { label: '총 결제금액', value: '40,000원' },
      { label: '리뷰 내역', value: '1건' },
    ],
    description: '깔끔한 연습실과 다양한 악기를 갖춘 공간입니다.',
    tags: ['합주', '녹음', '24시'],
  },
};

/** Figma: 2개의 채팅 */
const THREAD_PRESETS: ChatThread[] = [
  {
    id: 't1',
    title: '제이니',
    preview: '안녕하세요! 😊 매장에 드럼세트와',
    timeLabel: '오후 2:23',
    unread: 2,
  },
  {
    id: 't2',
    title: '영케이',
    preview: '추석연휴에도 혹시 영업 하시나요?',
    timeLabel: '어제',
  },
];

const MESSAGES_T1: ChatMessage[] = [
  {
    id: 'm1',
    kind: 'in',
    senderName: '제이니',
    text: '안녕하세요! 혹시 이번 주 토요일 오후 2시 타임 예약 가능할까요?',
    time: '오후 2:25',
  },
  {
    id: 'm2',
    kind: 'out',
    lines: ['안녕하세요! 😊', '네, 토요일 오후 2시~4시는 현재 예약 가능합니다.'],
    time: '오후 2:20',
  },
  {
    id: 'm3',
    kind: 'in',
    senderName: '제이니',
    text: '혹시 드럼 세트랑 베이스 앰프는 기본 제공인가요?',
    time: '오후 2:25',
  },
  {
    id: 'm4',
    kind: 'out',
    lines: ['네, 드럼 세트와 베이스 앰프 기본 제공되고, 기타 앰프는 2대 준비되어 있습니다.'],
    time: '오후 2:20',
  },
];

export type ChatPageModel = {
  threadListTitle: string;
  threads: ChatThread[];
  activeThreadId: string;
  messages: ChatMessage[];
  chatDateLabel: string;
  vendorPanel: ChatVendorPanel;
  showEmptyPrompt: boolean;
};

function panelForVendor(vendor: string | null): ChatVendorPanel {
  if (vendor && VENDOR_PANELS[vendor]) {
    return VENDOR_PANELS[vendor];
  }
  return VENDOR_PANELS[DEFAULT_VENDOR_KEY];
}

export function resolveChatPageModel(params: URLSearchParams): ChatPageModel {
  const vendor = params.get('vendor');
  const threadId = params.get('t');
  const forceEmpty = params.get('empty') === '1';

  const vendorPanel = panelForVendor(vendor);
  const threads = THREAD_PRESETS;
  const activeThreadId =
    threadId && threads.some((t) => t.id === threadId) ? threadId : threads[0].id;

  const messagesForThread = activeThreadId === 't1' ? MESSAGES_T1 : [];
  const hasConversation = !forceEmpty && messagesForThread.length > 0;

  return {
    threadListTitle: `${threads.length}개의 채팅`,
    threads,
    activeThreadId,
    messages: hasConversation ? messagesForThread : [],
    chatDateLabel: '25년 8월 13일 (수)',
    showEmptyPrompt: !hasConversation,
    vendorPanel,
  };
}

// ─── API 연동 헬퍼 ────────────────────────────────────────────────────────────

export function formatChatTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';

  const nowKst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const todayKst = new Date(nowKst.getFullYear(), nowKst.getMonth(), nowKst.getDate());
  const dateKst = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const dayKst = new Date(dateKst.getFullYear(), dateKst.getMonth(), dateKst.getDate());
  const diffDays = Math.round((todayKst.getTime() - dayKst.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  if (diffDays === 1) return '어제';
  if (dateKst.getFullYear() === nowKst.getFullYear()) {
    return date.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
    });
  }
  const yyyy = dateKst.getFullYear();
  const mm = String(dateKst.getMonth() + 1).padStart(2, '0');
  const dd = String(dateKst.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export function chatRoomToThread(room: ChatRoomResponse): ChatThread {
  return {
    id: room.chatRoomId,
    title: room.partnerNickname ?? '알 수 없는 사용자',
    preview: room.lastMessagePreview ?? '',
    timeLabel: formatChatTime(room.lastMessageAt),
    unread: room.unreadCount > 0 ? room.unreadCount : undefined,
    unreadOverflow: room.unreadCount > 99,
  };
}

export function chatMessageToUiMessage(
  msg: ChatMessageResponse,
  currentUserId: number,
  partnerNickname?: string,
): ChatMessage {
  const time = formatChatTime(msg.createdAt);
  if (msg.senderUserId === currentUserId) {
    return { id: msg.messageId, kind: 'out', lines: [msg.content], time };
  }
  return {
    id: msg.messageId,
    kind: 'in',
    senderName: partnerNickname ?? '상대방',
    text: msg.content,
    time,
  };
}
