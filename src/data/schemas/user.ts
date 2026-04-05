/**
 * UC-12 프로필 · UC-13 계정 · UC-14 알림 설정 · UC-17 헤더 요약
 * @see docs/BACKEND_API.md §11–13, §16–17
 */

export type UserMeProfileGenderDto = 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';

/** GET/PATCH /api/v1/users/me/profile */
export type UserProfileResponseDto = {
  nickname: string;
  bio: string;
  profileImageRef?: string;
  profileImageUrl?: string | null;
  genreIds: string[];
  instrumentIds: string[];
  regionCode?: string;
  regionLabel?: string;
  gender?: UserMeProfileGenderDto;
  sns?: {
    instagram?: string;
    youtube?: string;
  };
};

export type PatchUserProfileRequestDto = {
  nickname?: string;
  bio?: string;
  profileImageRef?: string;
  genreIds?: string[];
  instrumentIds?: string[];
  sns?: UserProfileResponseDto['sns'];
};

/** GET /api/v1/users/me/account */
export type UserAccountResponseDto = {
  emailMasked: string;
  phoneMasked?: string;
  linkedProviders?: ('kakao' | 'google' | 'apple')[];
};

/** POST /api/v1/users/me/password */
export type ChangePasswordRequestDto = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

/** GET /api/v1/users/me/notification-settings */
export type NotificationChannelsDto = Record<string, boolean>;

export type NotificationSettingsResponseDto = {
  channels: NotificationChannelsDto;
};

export type PutNotificationSettingsRequestDto = NotificationSettingsResponseDto;

/** UI 토글 3개 — `channels` 객체와 키 매핑은 백엔드와 합의 */
export type NotificationSettingsUiStateDto = {
  communityEnabled: boolean;
  interestEnabled: boolean;
  marketingEnabled: boolean;
};

/** GET /api/v1/users/me/summary — 헤더 프로필·배지 */
export type UserMeSummaryResponseDto = {
  displayName: string;
  email: string;
  profileImageUrl?: string | null;
  pointsLabel: string;
  couponCountLabel: string;
  reservationBadgeCount: number;
  cartCount?: number;
  wishlistCount?: number;
  unreadNotificationCount?: number;
};
