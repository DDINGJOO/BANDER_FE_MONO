import type { AppNotification } from '../notifications';
import type {
  NotificationApiDto,
  SpringPage,
} from '../schemas/notificationsApi';
import type {
  NotificationCategoryDto,
  NotificationIconKindDto,
} from '../schemas/notifications';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** type → icon. 현재 백엔드 enum은 전부 booking/payment/auth 계열이라 'bell'로 수렴. */
export function iconForNotificationType(type: string): NotificationIconKindDto {
  if (type.startsWith('BOOKING_')) return 'bell';
  if (type.startsWith('PAYMENT_') || type.startsWith('REFUND_')) return 'bell';
  // 추후 LIKE/COMMENT/NEWS enum 추가 시 이 매핑에 확장.
  return 'bell';
}

/** type → category (activity/news). 현재는 모든 enum이 activity. */
export function categoryForNotificationType(
  _type: string,
): NotificationCategoryDto {
  return 'activity';
}

/** KST 기준 YYYY-MM-DD 문자열 */
function toKstDateKey(date: Date): string {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

function parseServerDate(value: string): Date {
  // 백엔드 LocalDateTime은 offset이 없어 브라우저 로컬 TZ로 오해석될 수 있음.
  // BANDER 서버는 KST(Asia/Seoul) 기준이므로 +09:00을 명시해서 파싱한다.
  const hasOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasOffset ? value : `${value}+09:00`);
}

/** 섹션: 같은 KST 날짜면 today, 그 외는 week (페이지가 최신순이라 더 오래된 것도 week 섹션에 포함). */
export function sectionForCreatedAt(
  createdAt: string,
  now: Date = new Date(),
): 'today' | 'week' {
  const created = parseServerDate(createdAt);
  return toKstDateKey(created) === toKstDateKey(now) ? 'today' : 'week';
}

/** 상대 시간 라벨 (KST) */
export function timeLabelForCreatedAt(
  createdAt: string,
  now: Date = new Date(),
): string {
  const created = parseServerDate(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const createdKey = toKstDateKey(created);
  const nowKey = toKstDateKey(now);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffDay = Math.round(
    (new Date(nowKey).getTime() - new Date(createdKey).getTime()) / oneDayMs,
  );
  if (diffDay === 1) return '어제';
  if (diffDay >= 2 && diffDay <= 6) return `${diffDay}일 전`;

  const shifted = new Date(created.getTime() + KST_OFFSET_MS);
  const yy = shifted.getUTCFullYear().toString().slice(2);
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

export function notificationFromApi(
  dto: NotificationApiDto,
  now: Date = new Date(),
): AppNotification {
  return {
    id: String(dto.notificationId),
    section: sectionForCreatedAt(dto.createdAt, now),
    category: categoryForNotificationType(dto.type),
    icon: iconForNotificationType(dto.type),
    message: (dto.content && dto.content.trim()) || dto.title,
    timeLabel: timeLabelForCreatedAt(dto.createdAt, now),
    read: dto.read,
    // thumbUrl/cta: 백엔드가 아직 미제공 → referenceType/Id 기반 라우팅은 추후 확장
  };
}

export function notificationsFromApiPage(
  page: SpringPage<NotificationApiDto>,
  now: Date = new Date(),
): AppNotification[] {
  return page.content.map((dto) => notificationFromApi(dto, now));
}
