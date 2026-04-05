/**
 * Figma 6539:37163 `신고 카테고리` — 항목·순서 고정
 * (트리거 기본값은 6435:27424와 동일하게 첫 줄)
 */
export const COMMUNITY_REPORT_REASONS = [
  '욕설, 비속어, 음란성 내용을 포함한 게시글',
  '도배, 스팸, 광고성 게시글',
  '분란을 조장하는 게시글',
  '타업체를 광고한 게시글',
  '허위 사기성 내용',
  '기타',
] as const;

export type CommunityReportReason = (typeof COMMUNITY_REPORT_REASONS)[number];

export const COMMUNITY_REPORT_DETAIL_PLACEHOLDER =
  '신고 사유를 상세히 남겨 주시면 내용 확인 시 많은 도움이 됩니다.';

export const COMMUNITY_REPORT_DETAIL_MAX = 80;
