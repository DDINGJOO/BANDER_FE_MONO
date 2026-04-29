import { getOrCreateDeviceId } from '../lib/deviceId';
import { getJson, postJson, requestJson } from './client';

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
  params: { cursor?: string; afterId?: string; size?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.cursor) query.set('cursor', params.cursor);
  // PR-D: afterId 는 ASC (oldest-on-top) gap fill 용. 백엔드는
  // messageId > afterId ORDER BY messageId ASC 로 응답.
  if (params.afterId) query.set('afterId', params.afterId);
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

/**
 * chat-image upload grant + S3 PUT + commit.
 *
 * <p>Flow (community 의 uploadPostInlineImage 와 동일 패턴):
 *   1. POST /api/v1/media/uploads (ownerType=CHAT, targetType=CHAT_IMAGE)
 *      → mediaRef + uploadUrl + ownershipTicket + publicUrl
 *   2. PUT to S3 (resize 자동 적용 by putAndCommit)
 *   3. POST /api/v1/media/{mediaRef}/commit
 *
 * <p>호출자는 응답의 imageUrl 을 sendMessage 의 imageUrl 필드에 그대로 부착해야
 * 한다. content 필드는 mediaRef 를 사용 (R1-J 백엔드는 IMAGE 메시지에서
 * content=mediaRef 를 기대).
 */
export type ChatImageUploadResult = {
  mediaRef: string;
  imageUrl: string;
  ownershipTicket: string;
};

export async function uploadChatImage(file: File): Promise<ChatImageUploadResult> {
  type Grant = {
    mediaRef: string;
    uploadUrl: string;
    publicUrl: string;
    uploadHeaders?: Record<string, string>;
    ownershipTicket?: string;
  };
  const grant = await postJson<Grant>('/api/v1/media/uploads', {
    contentLength: file.size,
    contentType: file.type,
    fileName: file.name,
    ownerKey: null,
    ownerType: 'CHAT',
    targetType: 'CHAT_IMAGE',
  });
  const { putAndCommit } = await import('./media');
  await putAndCommit({
    mediaId: grant.mediaRef,
    uploadUrl: grant.uploadUrl,
    uploadHeaders: grant.uploadHeaders,
    ownershipTicket: grant.ownershipTicket,
    file,
  });
  return {
    mediaRef: grant.mediaRef,
    imageUrl: grant.publicUrl ?? '',
    ownershipTicket: grant.ownershipTicket ?? '',
  };
}

export type DeviceCursorResponse = {
  chatRoomId: string;
  deviceId: string;
  lastSeenMessageId: string;
};

export function updateChatCursor(roomId: string, lastSeenMessageId: string) {
  return requestJson<DeviceCursorResponse>(`/api/v1/chat/rooms/${roomId}/cursor`, {
    body: JSON.stringify({ lastSeenMessageId }),
    headers: {
      'X-Device-Id': getOrCreateDeviceId(),
    },
    method: 'PUT',
  });
}

/**
 * PR-D: 멀티 디바이스 gap fill 용 sync-hint.
 *
 * <p>각 방에 대한 (lastSeenMessageId, latestMessageIdServer) 페어를 받아서
 * 클라이언트가 누락된 구간만 afterId 로 fetch 할 수 있게 한다.
 * 클라이언트가 잠깐 오프라인이거나 백그라운드였던 동안 다른 디바이스에서
 * 발생한 read/메시지가 반영되도록 reconnect 또는 visibility 'visible'
 * 시점에 호출.
 *
 * <p>백엔드는 X-Device-Id 헤더로 디바이스를 식별한다. 새 device id 가
 * 발급된 직후 첫 호출은
 * lastSeenMessageId=0 으로 응답할 수 있고, 이는 시작점에서의 정상 동작.
 */
export type SyncHintRow = {
  /** 백엔드는 Long 을 string 으로 직렬화 (@JsonFormat STRING) */
  chatRoomId: string;
  lastSeenMessageId: string;
  latestMessageIdServer: string;
};

type SyncHintEnvelope = {
  type: 'sync.hint';
  deviceId: string;
  rooms: SyncHintRow[];
};

export async function getSyncHint() {
  const payload = await requestJson<SyncHintEnvelope>('/api/v1/chat/sync-hint', {
    headers: {
      'X-Device-Id': getOrCreateDeviceId(),
    },
    method: 'GET',
  });
  return payload.rooms ?? [];
}
