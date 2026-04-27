/**
 * 헤더 프로필 드롭다운 Figma 6052:30970 / 6048:30244
 * API 응답을 그대로 매핑할 수 있도록 필드 단위로 정의합니다.
 */
import { DEFAULT_PROFILE_IMAGE_URL } from '../config/media';

export type HomeProfileMenuModel = {
  /** 쿠폰 영역 우측 라벨 (예: 3개) */
  couponCountLabel: string;
  displayName: string;
  email: string;
  /** 포인트 카드 라벨 (예: 20,000P) */
  pointsLabel: string;
  /** 프로필 이미지 URL — 없으면 기본 아바타 */
  profileImageUrl?: string;
  /** 내 예약 배지 숫자 */
  reservationBadgeCount: number;
};

export const DEFAULT_HOME_PROFILE_MENU_MODEL: HomeProfileMenuModel = {
  couponCountLabel: '0개',
  displayName: '사용자님',
  email: '',
  pointsLabel: '0P',
  profileImageUrl: DEFAULT_PROFILE_IMAGE_URL,
  reservationBadgeCount: 0,
};

export function resolveHomeProfileMenuModel(partial?: Partial<HomeProfileMenuModel>): HomeProfileMenuModel {
  const model = { ...DEFAULT_HOME_PROFILE_MENU_MODEL, ...partial };
  return {
    ...model,
    profileImageUrl: model.profileImageUrl || DEFAULT_PROFILE_IMAGE_URL,
  };
}
