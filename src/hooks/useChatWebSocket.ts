import { useEffect, useRef } from 'react';
import { ChatMessageResponse } from '../api/chat';
import { subscribeUserQueue, disconnectChat } from '../lib/chatWebSocket';

/**
 * PR-F: chat-v2 user queue 단일 구독.
 *
 * <p>호출자는 콜백 안에서 `msg.chatRoomId` 를 보고 활성 방 / 비활성 방 분기
 * 처리한다 (활성 방 → setMessages append, 비활성 방 → unread badge +1).
 *
 * <p>roomId 변경 시 구독 재attach 비용 제거 — user queue 한 번만 구독.
 */
export function useChatWebSocket(
  enabled: boolean,
  onMessage: (msg: ChatMessageResponse) => void,
): void {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscribeUserQueue((msg) => {
      callbackRef.current(msg);
    });
    return () => {
      unsubscribe();
    };
  }, [enabled]);

  useEffect(() => {
    return () => {
      disconnectChat();
    };
  }, []);
}
