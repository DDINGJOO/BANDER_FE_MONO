import { useEffect, useRef } from 'react';
import { ChatMessageResponse } from '../api/chat';
import { subscribeToRoom, disconnectChat } from '../lib/chatWebSocket';

export function useChatWebSocket(
  roomId: string | null,
  onMessage: (msg: ChatMessageResponse) => void,
): void {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = subscribeToRoom(roomId, (msg) => {
      callbackRef.current(msg);
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  useEffect(() => {
    return () => {
      disconnectChat();
    };
  }, []);
}
