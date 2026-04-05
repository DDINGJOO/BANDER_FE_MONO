/**
 * 커뮤니티 신고 — 제안: POST /api/v1/community/reports
 */

export type CommunityReportTargetDto = 'post' | 'comment';

export type CreateCommunityReportRequestDto = {
  targetType: CommunityReportTargetDto;
  targetId: string;
  reasonCode: string;
  detail?: string;
};

export type CreateCommunityReportResponseDto = {
  id: string;
  status: string;
};
