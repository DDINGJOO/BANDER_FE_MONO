export type ChatHrefParams = {
  space?: string | null;
  vendor?: string | null;
  thread?: string | null;
  /** Figma 채팅(채팅전) — 메시지 없는 빈 상태 */
  empty?: boolean;
};

export function buildChatHref(params: ChatHrefParams = {}): string {
  const q = new URLSearchParams();
  if (params.space) q.set('space', params.space);
  if (params.vendor) q.set('vendor', params.vendor);
  if (params.thread) q.set('t', params.thread);
  if (params.empty) q.set('empty', '1');
  const s = q.toString();
  return s ? `/chat?${s}` : '/chat';
}
