/**
 * 채팅 — 제안 REST (현재 chatPage.ts 목업과 필드 정합)
 * 실제로는 WebSocket/스트림이 있을 수 있음; 초기 로드·히스토리용 DTO
 */

export type ChatThreadDto = {
  id: string;
  title: string;
  preview: string;
  timeLabel: string;
  unread?: number;
  unreadOverflow?: boolean;
  vendorSlug?: string;
  spaceSlug?: string;
};

export type ChatMessageInDto = {
  id: string;
  kind: 'in';
  senderName: string;
  text: string;
  time: string;
};

export type ChatMessageOutDto = {
  id: string;
  kind: 'out';
  lines: string[];
  time: string;
};

export type ChatMessageDto = ChatMessageInDto | ChatMessageOutDto;

export type ChatVendorPanelDto = {
  name: string;
  statusLine: string;
  stats: { label: string; value: string }[];
  addressLine?: string;
  ratingLabel?: string;
  description?: string;
  tags?: string[];
};

/** GET /api/v1/chat/threads */
export type ChatThreadsResponseDto = {
  threads: ChatThreadDto[];
};

/** GET /api/v1/chat/threads/{id}/messages?cursor= */
export type ChatMessagesResponseDto = {
  vendorPanel?: ChatVendorPanelDto;
  messages: ChatMessageDto[];
  nextCursor?: string | null;
};
