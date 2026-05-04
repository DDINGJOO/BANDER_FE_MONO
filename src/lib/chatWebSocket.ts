import { Client, IMessage } from '@stomp/stompjs';
import { ChatMessageResponse } from '../api/chat';
import { getOrCreateDeviceId } from './deviceId';

type ChatMessageCallback = (message: ChatMessageResponse) => void;

let stompClient: Client | null = null;
const subscriptions: Map<string, { id: string; unsubscribe: () => void }> = new Map();
const USER_CHAT_DESTINATION = '/user/queue/chat';

// PR-F: user queue 한 채널이 사용자의 모든 방 fanout 을 운반.
// chat-v2 백엔드의 Redis pub/sub user inbox → Spring user-destination resolver
// 모델에 맞춤. 한 사용자당 1 구독만 유지 (USER_QUEUE_KEY).
const USER_QUEUE_KEY = '__user_queue__';

function normalizeIncomingMessage(raw: unknown): ChatMessageResponse {
  const parsed = (raw ?? {}) as Record<string, unknown>;
  return {
    messageId: String(parsed.messageId ?? ''),
    chatRoomId: String(parsed.chatRoomId ?? ''),
    senderUserId: String(parsed.senderUserId ?? ''),
    content: typeof parsed.content === 'string' ? parsed.content : '',
    messageType:
      parsed.messageType === 'IMAGE' || parsed.messageType === 'SYSTEM'
        ? parsed.messageType
        : 'TEXT',
    readAt: typeof parsed.readAt === 'string' ? parsed.readAt : null,
    createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : '',
    imageUrl:
      typeof parsed.imageUrl === 'string'
        ? parsed.imageUrl
        : typeof parsed.mediaUrl === 'string'
          ? parsed.mediaUrl
          : null,
    senderNickname:
      typeof parsed.senderNickname === 'string' ? parsed.senderNickname : null,
    senderProfileImageRef:
      typeof parsed.senderProfileImageRef === 'string' ? parsed.senderProfileImageRef : null,
    senderProfileImageUrl:
      typeof parsed.senderProfileImageUrl === 'string' ? parsed.senderProfileImageUrl : null,
  };
}

export function connectChat(): Client {
  if (stompClient?.connected) return stompClient;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const deviceId = getOrCreateDeviceId();
  const wsUrl = `${protocol}//${window.location.host}/ws/chat?deviceId=${encodeURIComponent(deviceId)}`;

  stompClient = new Client({
    brokerURL: wsUrl,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (str) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[STOMP]', str);
      }
    },
  });

  stompClient.activate();
  return stompClient;
}

export function subscribeToRoom(roomId: string, callback: ChatMessageCallback): () => void {
  const client = connectChat();
  const topic = `/topic/chat/rooms/${roomId}`;

  if (subscriptions.has(roomId)) {
    subscriptions.get(roomId)!.unsubscribe();
    subscriptions.delete(roomId);
  }

  const doSubscribe = () => {
    const sub = client.subscribe(topic, (message: IMessage) => {
      const parsed = normalizeIncomingMessage(JSON.parse(message.body));
      callback(parsed);
    });
    subscriptions.set(roomId, { id: sub.id, unsubscribe: () => sub.unsubscribe() });
  };

  if (client.connected) {
    doSubscribe();
  } else {
    const previousOnConnect = client.onConnect;
    client.onConnect = (frame) => {
      if (previousOnConnect) previousOnConnect(frame);
      doSubscribe();
    };
  }

  return () => {
    if (subscriptions.has(roomId)) {
      subscriptions.get(roomId)!.unsubscribe();
      subscriptions.delete(roomId);
    }
  };
}

/**
 * PR-F: 사용자별 inbox 구독 — `/user/queue/chat`. 모든 방의 메시지를 단일
 * 채널에서 수신하고 호출자가 콜백 단계에서 활성/비활성 방 분기 처리.
 */
export function subscribeUserQueue(callback: ChatMessageCallback): () => void {
  const client = connectChat();

  if (subscriptions.has(USER_QUEUE_KEY)) {
    subscriptions.get(USER_QUEUE_KEY)!.unsubscribe();
    subscriptions.delete(USER_QUEUE_KEY);
  }

  const doSubscribe = () => {
    const sub = client.subscribe(USER_CHAT_DESTINATION, (message: IMessage) => {
      const parsed = normalizeIncomingMessage(JSON.parse(message.body));
      callback(parsed);
    });
    subscriptions.set(USER_QUEUE_KEY, {
      id: sub.id,
      unsubscribe: () => sub.unsubscribe(),
    });
  };

  if (client.connected) {
    doSubscribe();
  } else {
    const previousOnConnect = client.onConnect;
    client.onConnect = (frame) => {
      if (previousOnConnect) previousOnConnect(frame);
      doSubscribe();
    };
  }

  return () => {
    if (subscriptions.has(USER_QUEUE_KEY)) {
      subscriptions.get(USER_QUEUE_KEY)!.unsubscribe();
      subscriptions.delete(USER_QUEUE_KEY);
    }
  };
}

/**
 * Publish a chat message over the STOMP WebSocket.
 *
 * R1-J: `imageUrl` is the denormalized CDN URL captured from the chat-image
 * upload grant. When present (and `messageType === 'IMAGE'`), the server
 * stores it alongside the mediaRef in `chat_message.media_url` in the same
 * INSERT tx so subsequent reads do not round-trip to media-service.
 */
export function sendWsMessage(
  roomId: string,
  content: string,
  options: {
    messageType?: 'TEXT' | 'IMAGE' | 'SYSTEM';
    clientMsgId?: string;
    imageUrl?: string;
  } = {},
): void {
  if (!stompClient?.connected) {
    throw new Error('WebSocket not connected');
  }
  const messageType = options.messageType ?? 'TEXT';
  const body: Record<string, string> = { content, messageType };
  if (options.clientMsgId) body.clientMsgId = options.clientMsgId;
  if (options.imageUrl && messageType === 'IMAGE') body.imageUrl = options.imageUrl;
  stompClient.publish({
    destination: `/app/chat/rooms/${roomId}`,
    body: JSON.stringify(body),
  });
}

export function disconnectChat(): void {
  subscriptions.forEach((sub) => sub.unsubscribe());
  subscriptions.clear();
  stompClient?.deactivate();
  stompClient = null;
}
