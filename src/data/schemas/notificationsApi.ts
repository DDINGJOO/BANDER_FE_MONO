/**
 * 백엔드 notification-service 원본 DTO (src/main/java/.../NotificationResponse.java).
 * 프론트 UI 모델(AppNotification)과는 다르며, 어댑터를 통해 변환된다.
 */

export type NotificationApiDto = {
  notificationId: string;
  type: string;
  title: string;
  content: string;
  referenceType: string | null;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
};

/** Spring Data Page JSON 중 필요한 필드만 */
export type SpringPage<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type UnreadCountDto = {
  count: number;
};
