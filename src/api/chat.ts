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
  partnerProfileImageUrl?: string | null;
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
  /**
   * Denormalized CDN URL for IMAGE messages (R1-J / chat-service V6).
   * Renderer prefers this over rebuilding from the legacy `content` (mediaRef).
   * NULL for TEXT/SYSTEM messages and for legacy IMAGE rows persisted before V6.
   */
  imageUrl: string | null;
  /**
   * R2-Cs: denormalized author snapshot — sender's nickname captured at
   * send time (chat-service V7). Backend supplements via gRPC fallback for
   * legacy NULL rows; client should still tolerate undefined / null.
   */
  senderNickname?: string | null;
  /** R2-Cs: sender's media ref (UUID). NULL for default avatar / legacy. */
  senderProfileImageRef?: string | null;
  /**
   * R2-Cs: denormalized CDN URL of the sender's profile image at send time.
   * Renderer prefers this over rebuilding from `senderProfileImageRef` via
   * `resolveProfileImageUrl(ref, url)`. Stays in sync as profile updates
   * fan out via the user-profile-events Kafka topic.
   */
  senderProfileImageUrl?: string | null;
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
  /**
   * Idempotency key — `(senderUserId, clientMsgId)` uniquely identifies a
   * client-originated send. Server returns the existing row on duplicate.
   */
  clientMsgId?: string;
  /**
   * Denormalized CDN URL captured from the chat-image upload grant response
   * (R1-J / chat-service V6). SHOULD be sent whenever `messageType === 'IMAGE'`
   * so reads avoid a per-render round-trip to media-service.
   * Server stores it in chat_message.media_url in the same INSERT tx.
   * Ignored when messageType !== 'IMAGE'.
   */
  imageUrl?: string;
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
