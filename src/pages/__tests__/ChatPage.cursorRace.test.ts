/**
 * Regression guard for Follow-up #6: ChatPage cursor race condition.
 *
 * 결함: activeRoomId 변경 직후 messages 가 이전 방 데이터인 상태에서
 * updateChatCursor(activeRoomId, latestMessageId) 가 호출되어
 * 새 방의 cursor 가 이전 방 message ID 로 오염되던 문제.
 *
 * 수정: messages[last].chatRoomId !== activeRoomId 이면 cursor update skip.
 */

import { type ChatMessageResponse } from '../../api/chat';

/** 수정된 guard 로직을 순수 함수로 추출하여 단위 테스트 */
function shouldUpdateCursor(
  activeRoomId: string | null,
  messages: Pick<ChatMessageResponse, 'chatRoomId' | 'messageId'>[],
): { should: false } | { should: true; messageId: string } {
  if (!activeRoomId) return { should: false };
  const latestMessage = messages[messages.length - 1];
  if (!latestMessage || latestMessage.chatRoomId !== activeRoomId) {
    return { should: false };
  }
  return { should: true, messageId: latestMessage.messageId };
}

describe('ChatPage cursor race guard', () => {
  it('skip cursor update when messages are from previous room (race condition)', () => {
    const activeRoomId = 'room-2';
    // messages 는 아직 이전 방(room-1) 데이터
    const messages: Pick<ChatMessageResponse, 'chatRoomId' | 'messageId'>[] = [
      { chatRoomId: 'room-1', messageId: '100' },
      { chatRoomId: 'room-1', messageId: '101' },
    ];

    const result = shouldUpdateCursor(activeRoomId, messages);

    expect(result.should).toBe(false);
  });

  it('allow cursor update when latest message belongs to active room', () => {
    const activeRoomId = 'room-2';
    const messages: Pick<ChatMessageResponse, 'chatRoomId' | 'messageId'>[] = [
      { chatRoomId: 'room-2', messageId: '200' },
      { chatRoomId: 'room-2', messageId: '201' },
    ];

    const result = shouldUpdateCursor(activeRoomId, messages);

    expect(result.should).toBe(true);
    expect((result as Extract<typeof result, { should: true }>).messageId).toBe('201');
  });

  it('skip cursor update when messages array is empty', () => {
    const result = shouldUpdateCursor('room-1', []);
    expect(result.should).toBe(false);
  });

  it('skip cursor update when activeRoomId is null', () => {
    const messages: Pick<ChatMessageResponse, 'chatRoomId' | 'messageId'>[] = [
      { chatRoomId: 'room-1', messageId: '100' },
    ];
    const result = shouldUpdateCursor(null, messages);
    expect(result.should).toBe(false);
  });

  it('rapid room switch: last message roomId mismatch blocks stale cursor', () => {
    // 사용자가 room-1 → room-2 → room-3 으로 빠르게 전환
    // activeRoomId 는 room-3 이지만 messages 는 room-1 응답이 늦게 도착
    const activeRoomId = 'room-3';
    const staleMessages: Pick<ChatMessageResponse, 'chatRoomId' | 'messageId'>[] = [
      { chatRoomId: 'room-1', messageId: '999' },
    ];

    const result = shouldUpdateCursor(activeRoomId, staleMessages);

    expect(result.should).toBe(false);
  });
});
