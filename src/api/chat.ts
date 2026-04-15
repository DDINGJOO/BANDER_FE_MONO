import { getJson, postJson } from './client';

// --- Types ---

export type ChatRoomType = 'VENDOR' | 'PERSONAL';

export type ChatRoomResponse = {
  chatRoomId: string;
  participantA: string;
  participantB: string;
  status: 'ACTIVE' | 'ARCHIVED';
  chatRoomType: ChatRoomType;
  vendorId: string | null;
  vendorSlug: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  partnerNickname: string | null;
  partnerProfileImage: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
};

export type ChatMessageResponse = {
  messageId: string;
  chatRoomId: string;
  /** Backend serializes Long as string via @JsonFormat(shape = STRING) */
  senderUserId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  readAt: string | null;
  createdAt: string;
};

export type CursorPageResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
  totalCount: number | null;
  size: number;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type CreateChatRoomRequest = {
  targetUserId: string;
  vendorId?: string;
  vendorSlug?: string;
};

export type SendMessageRequest = {
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'SYSTEM';
};

// --- Functions ---

export function createChatRoom(req: CreateChatRoomRequest) {
  return postJson<ChatRoomResponse>('/api/v1/chat/rooms', req);
}

export function getMyChatRooms(params: { page?: number; size?: number; type?: ChatRoomType } = {}) {
  const query = new URLSearchParams();
  if (params.page != null) query.set('page', String(params.page));
  if (params.size != null) query.set('size', String(params.size));
  if (params.type != null) query.set('type', params.type);
  const qs = query.toString();
  return getJson<PageResponse<ChatRoomResponse>>(
    `/api/v1/chat/rooms${qs ? `?${qs}` : ''}`,
  );
}

export function getChatRoomDetail(roomId: string) {
  return getJson<ChatRoomResponse>(`/api/v1/chat/rooms/${roomId}`);
}

export function getUnreadCount() {
  return getJson<number>('/api/v1/chat/rooms/unread-count');
}

export function getChatMessages(
  roomId: string,
  params: { cursor?: string; size?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.size != null) query.set('size', String(params.size));
  const qs = query.toString();
  return getJson<CursorPageResponse<ChatMessageResponse>>(
    `/api/v1/chat/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`,
  );
}

export function sendMessage(roomId: string, req: SendMessageRequest) {
  return postJson<ChatMessageResponse>(
    `/api/v1/chat/rooms/${roomId}/messages`,
    req,
  );
}

export function markAsRead(roomId: string) {
  return postJson<number>(`/api/v1/chat/rooms/${roomId}/messages/read`, {});
}
