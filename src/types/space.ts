/**
 * View-layer types for space listing/detail. API DTOs can be mapped into these later.
 */

export type SpaceSummaryTag = string;

export type SpaceVendor = {
  name: string;
  spaces: string;
};

export type SpaceReviewSnippet = {
  author: string;
  date: string;
  rating: string;
  text: string;
};

export type SpacePolicy = {
  body: string;
  title: string;
};

export type SpaceNoticeItem = {
  body: string;
  title: string;
};

export type SpacePricingLine = {
  label: string;
  value: string;
};
