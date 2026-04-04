/** Figma 6458:74015 — 알림 센터 데모 데이터 (API 연동 시 교체) */

export type NotificationTabFilter = 'all' | 'activity' | 'news';

export type NotificationTimeSection = 'today' | 'week';

export type NotificationIconKind = 'like' | 'bell' | 'comment' | 'gift';

export type AppNotification = {
  category: 'activity' | 'news';
  icon: NotificationIconKind;
  id: string;
  message: string;
  section: NotificationTimeSection;
  timeLabel: string;
  thumbUrl?: string;
  cta?: { href: string; label: string };
};

/** 썸네일은 안정적인 외부 플레이스홀더 (Figma MCP 에셋 만료 방지) */
const T1 = 'https://picsum.photos/seed/bander-n1/120/120';
const T2 = 'https://picsum.photos/seed/bander-n2/120/120';
const T3 = 'https://picsum.photos/seed/bander-n3/120/120';

export const APP_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 'n1',
    section: 'today',
    category: 'activity',
    icon: 'like',
    message: 'freshjoon님이 회원님의 게시글을 좋아합니다.',
    timeLabel: '방금',
    thumbUrl: T1,
  },
  {
    id: 'n2',
    section: 'today',
    category: 'activity',
    icon: 'bell',
    message:
      '회원님이 예약하신 [B룸 보컬트레이닝 전용] 예약이 확정되었습니다.',
    timeLabel: '1시간 전',
    thumbUrl: T2,
  },
  {
    id: 'n3',
    section: 'today',
    category: 'activity',
    icon: 'comment',
    message:
      '뿌에엥님이 회원님의 게시글에 댓글을 남겼습니다 : 정말 좋은 사장님을 만나셨네요!',
    timeLabel: '15시간 전',
    thumbUrl: T3,
  },
  {
    id: 'n4',
    section: 'today',
    category: 'activity',
    icon: 'bell',
    message:
      '회원님이 예약하신 [A룸 그랜드 피아노 대관] 예약이 확정되었습니다.',
    timeLabel: '15시간 전',
    thumbUrl: T3,
  },
  {
    id: 'n5',
    section: 'week',
    category: 'activity',
    icon: 'bell',
    message:
      '회원님이 문의하신 ‘예약은 어떻게 하나요?’ 에 대한 답변이 완료되었습니다.',
    timeLabel: '어제',
  },
  {
    id: 'n6',
    section: 'week',
    category: 'news',
    icon: 'gift',
    message:
      '밴더 신규 이벤트! 내 공간 셀프캠 챌린지 🎥를 진행하고 엄청난 혜택을 받아보세요!',
    timeLabel: '25.08.23',
  },
  {
    id: 'n7',
    section: 'week',
    category: 'activity',
    icon: 'bell',
    message:
      '회원님이 예약하신 [A룸 그랜드 피아노 대관] 예약이 확정되었습니다.',
    timeLabel: '25.08.23',
    thumbUrl: T3,
  },
  {
    id: 'n8',
    section: 'week',
    category: 'activity',
    icon: 'bell',
    message: '신청하신 비즈니스 신청이 승인 완료되었습니다.',
    timeLabel: '15시간 전',
    cta: { label: '비즈니스로 이동하기', href: '/' },
  },
];

export function filterNotifications(
  items: readonly AppNotification[],
  tab: NotificationTabFilter,
): AppNotification[] {
  if (tab === 'all') return [...items];
  if (tab === 'activity') return items.filter((n) => n.category === 'activity');
  return items.filter((n) => n.category === 'news');
}
