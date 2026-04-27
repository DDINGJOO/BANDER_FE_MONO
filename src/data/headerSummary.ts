/**
 * UC-17 GET /api/v1/users/me/summary → 헤더 프로필 메뉴 모델
 */

import type { HomeProfileMenuModel } from '../types/homeProfileMenu';
import type { UserMeSummaryResponseDto } from './schemas/user';
import { resolveProfileImageUrl } from '../config/media';

export function homeProfileMenuFromUserSummary(dto: UserMeSummaryResponseDto): HomeProfileMenuModel {
  return {
    displayName: dto.displayName,
    email: dto.email,
    profileImageUrl: resolveProfileImageUrl(dto.profileImageUrl),
    pointsLabel: dto.pointsLabel,
    couponCountLabel: dto.couponCountLabel,
    reservationBadgeCount: dto.reservationBadgeCount,
  };
}
