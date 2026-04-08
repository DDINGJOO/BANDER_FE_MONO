/**
 * View-layer types for space listing/detail. API DTOs can be mapped into these later.
 */

export type SpaceSummaryTag = string;

/** 룸 상세 상단 요약 칩(아이콘+라벨) — Figma 메타 영역 */
export type SpaceSummaryFeatureKey = 'parking' | 'booking' | 'hvac' | 'wifi';

export type SpaceSummaryFeature = {
  key: SpaceSummaryFeatureKey;
  label: string;
};

/** Figma 6071:33033 — 상세정보 상단 6혜택 행 (`key` 있으면 요약 아이콘 재사용) */
export type SpaceDetailBenefitItem = {
  key?: SpaceSummaryFeatureKey;
  label: string;
};

export type SpaceVendor = {
  name: string;
  spaces: string;
};

export type SpaceReviewSnippet = {
  author: string;
  date: string;
  rating: string;
  text: string;
  /** Figma 후기: 첫 리뷰 아래 140×140 썸네일 그리드 개수 */
  photoCount?: number;
};

export type SpacePolicy = {
  body: string;
  title: string;
  imageUrl?: string | null;
};

export type SpaceNoticeItem = {
  body: string;
  title: string;
  imageUrl?: string | null;
};

export type SpacePricingLine = {
  label: string;
  value: string;
};

export type SpaceOperatingDay = {
  hours: string;
  isToday?: boolean;
  weekday: string;
};
