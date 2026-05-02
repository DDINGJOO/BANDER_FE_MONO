import {
  categoryForNotificationType,
  detailPathForNotification,
  iconForNotificationType,
  notificationFromApi,
  notificationsFromApiPage,
  sectionForCreatedAt,
  timeLabelForCreatedAt,
} from '../notificationsFromApi';
import type {
  NotificationCursorPage,
  NotificationApiDto,
  SpringPage,
} from '../../schemas/notificationsApi';

/** KST 벽시계를 백엔드가 반환하는 LocalDateTime 문자열(offset 없음)로 표현 */
function kstIsoLocal(y: number, mo: number, d: number, h = 12, mi = 0): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${y}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:00`;
}

// NOW = 2026-04-13 12:00 KST (= 03:00 UTC)
const NOW = new Date('2026-04-13T12:00:00+09:00');

describe('notificationsFromApi adapter', () => {
  describe('sectionForCreatedAt', () => {
    it('오늘 KST → today', () => {
      expect(sectionForCreatedAt(kstIsoLocal(2026, 4, 13, 8, 0), NOW)).toBe(
        'today',
      );
    });

    it('어제 KST → week', () => {
      expect(sectionForCreatedAt(kstIsoLocal(2026, 4, 12, 23, 30), NOW)).toBe(
        'week',
      );
    });

    it('한 달 전 → week (페이지 최신순 가정)', () => {
      expect(sectionForCreatedAt(kstIsoLocal(2026, 3, 10), NOW)).toBe('week');
    });
  });

  describe('timeLabelForCreatedAt', () => {
    it('1분 이내 → 방금', () => {
      // NOW보다 30초 전
      const justNow = new Date(NOW.getTime() - 30_000).toISOString();
      expect(timeLabelForCreatedAt(justNow, NOW)).toBe('방금');
    });

    it('59분 → 59분 전', () => {
      expect(timeLabelForCreatedAt(kstIsoLocal(2026, 4, 13, 11, 1), NOW)).toBe(
        '59분 전',
      );
    });

    it('3시간 → 3시간 전', () => {
      expect(timeLabelForCreatedAt(kstIsoLocal(2026, 4, 13, 9, 0), NOW)).toBe(
        '3시간 전',
      );
    });

    it('어제 (KST 달력 기준)', () => {
      expect(timeLabelForCreatedAt(kstIsoLocal(2026, 4, 12, 10, 0), NOW)).toBe(
        '어제',
      );
    });

    it('3일 전', () => {
      expect(timeLabelForCreatedAt(kstIsoLocal(2026, 4, 10, 12, 0), NOW)).toBe(
        '3일 전',
      );
    });

    it('일주일 넘으면 YY.MM.DD', () => {
      expect(timeLabelForCreatedAt(kstIsoLocal(2026, 3, 20, 12, 0), NOW)).toBe(
        '26.03.20',
      );
    });
  });

  describe('type 매핑', () => {
    it('BOOKING_CONFIRMED → bell/activity', () => {
      expect(iconForNotificationType('BOOKING_CONFIRMED')).toBe('bell');
      expect(categoryForNotificationType('BOOKING_CONFIRMED')).toBe('activity');
    });

    it('PAYMENT_APPROVED → bell/activity', () => {
      expect(iconForNotificationType('PAYMENT_APPROVED')).toBe('bell');
      expect(categoryForNotificationType('PAYMENT_APPROVED')).toBe('activity');
    });

    it('REFUND_REQUESTED → bell', () => {
      expect(iconForNotificationType('REFUND_REQUESTED')).toBe('bell');
    });
  });

  describe('detailPathForNotification', () => {
    it('BOOKING 참조는 예약 상세로 이동한다', () => {
      expect(
        detailPathForNotification('BOOKING_CONFIRMED', 'BOOKING', '308'),
      ).toBe('/reservation-detail?bookingId=308');
    });

    it('COMMUNITY 참조는 게시글 상세로 이동한다', () => {
      expect(
        detailPathForNotification('COMMENT_ON_POST', 'COMMUNITY', '123'),
      ).toBe('/community/post/123');
    });

    it('CHAT 참조는 채팅방으로 이동한다', () => {
      expect(
        detailPathForNotification('CHAT_MESSAGE_RECEIVED', 'CHAT', '77'),
      ).toBe('/chat?t=77');
    });

    it('referenceId가 없으면 이동 경로를 만들지 않는다', () => {
      expect(
        detailPathForNotification('BOOKING_CONFIRMED', 'BOOKING', null),
      ).toBeUndefined();
    });
  });

  describe('notificationFromApi', () => {
    const base: NotificationApiDto = {
      notificationId: '42',
      type: 'BOOKING_CONFIRMED',
      title: '예약 확정',
      content: '예약이 확정되었습니다.',
      referenceType: 'BOOKING',
      referenceId: '7',
      read: false,
      createdAt: kstIsoLocal(2026, 4, 13, 11, 30),
    };

    it('기본 필드 매핑', () => {
      const result = notificationFromApi(base, NOW);
      expect(result.id).toBe('42');
      expect(result.section).toBe('today');
      expect(result.category).toBe('activity');
      expect(result.icon).toBe('bell');
      expect(result.message).toBe('예약이 확정되었습니다.');
      expect(result.timeLabel).toBe('30분 전');
      expect(result.read).toBe(false);
      expect(result.type).toBe('BOOKING_CONFIRMED');
      expect(result.referenceType).toBe('BOOKING');
      expect(result.referenceId).toBe('7');
      expect(result.detailPath).toBe('/reservation-detail?bookingId=7');
    });

    it('content 비어있으면 title로 fallback', () => {
      const result = notificationFromApi({ ...base, content: '   ' }, NOW);
      expect(result.message).toBe('예약 확정');
    });

    it('read=true 보존', () => {
      const result = notificationFromApi({ ...base, read: true }, NOW);
      expect(result.read).toBe(true);
    });
  });

  describe('notificationsFromApiPage', () => {
    it('커서 Page items 배열을 순서대로 매핑', () => {
      const page: NotificationCursorPage<NotificationApiDto> = {
        items: [
          {
            notificationId: '1',
            type: 'BOOKING_CREATED',
            title: 't1',
            content: 'c1',
            referenceType: null,
            referenceId: null,
            read: false,
            createdAt: kstIsoLocal(2026, 4, 13, 11, 50),
          },
          {
            notificationId: '2',
            type: 'PAYMENT_APPROVED',
            title: 't2',
            content: '',
            referenceType: null,
            referenceId: null,
            read: true,
            createdAt: kstIsoLocal(2026, 4, 12, 10, 0),
          },
        ],
        nextCursor: null,
        hasNext: false,
      };

      const result = notificationsFromApiPage(page, NOW);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].section).toBe('today');
      expect(result[1].id).toBe('2');
      expect(result[1].section).toBe('week');
      expect(result[1].message).toBe('t2'); // content 빈 문자열 → title fallback
    });

    it('Spring Page content 배열을 순서대로 매핑', () => {
      const page: SpringPage<NotificationApiDto> = {
        content: [
          {
            notificationId: '1',
            type: 'BOOKING_CREATED',
            title: 't1',
            content: 'c1',
            referenceType: null,
            referenceId: null,
            read: false,
            createdAt: kstIsoLocal(2026, 4, 13, 11, 50),
          },
          {
            notificationId: '2',
            type: 'PAYMENT_APPROVED',
            title: 't2',
            content: '',
            referenceType: null,
            referenceId: null,
            read: true,
            createdAt: kstIsoLocal(2026, 4, 12, 10, 0),
          },
        ],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 20,
        first: true,
        last: true,
        empty: false,
      };

      const result = notificationsFromApiPage(page, NOW);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].section).toBe('today');
      expect(result[1].id).toBe('2');
      expect(result[1].section).toBe('week');
      expect(result[1].message).toBe('t2'); // content 빈 문자열 → title fallback
    });
  });
});
