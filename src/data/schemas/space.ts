/**
 * UC-07 공간(룸) 상세·예약 보조 API
 * @see docs/BACKEND_API.md §6, §8 (일부)
 */

export type SpacePricingLineDto = { label: string; value: string };

export type SpaceOperatingDayDto = {
  weekday: string;
  hours: string;
  isToday?: boolean;
};

export type SpaceFacilityChipDto = { key: string; label: string };

export type SpaceNoticeDto = { title: string; body: string };

export type SpacePolicyDto = { title: string; body: string };

export type SpaceReviewPreviewItemDto = {
  author: string;
  date: string;
  rating: string;
  text: string;
  photoCount?: number;
};

export type SpaceRecommendationCardDto = {
  slug: string;
  title: string;
  thumbnailUrl?: string;
  priceLabel?: string;
  studioName?: string;
};

/** GET /api/v1/spaces/{slug} */
export type SpaceDetailResponseDto = {
  slug: string;
  title: string;
  category: string;
  studioName: string;
  vendorSlug: string;
  location: string;
  address: string;
  addressTransitHint?: string;
  stationDistanceLabel?: string;
  rating: string;
  reviewCount: number;
  priceLabel: string;
  priceSuffix: string;
  summaryPriceLines: SpacePricingLineDto[];
  hashTags: string[];
  operatingSummary: string;
  operatingWeek: SpaceOperatingDayDto[];
  galleryUrls: string[];
  facilityChips: SpaceFacilityChipDto[];
  detailBenefitChips: { label: string }[];
  notices: SpaceNoticeDto[];
  policies: SpacePolicyDto[];
  description: string;
  couponStripLabel?: string;
  trustBanner?: string;
  reviewPreview: SpaceReviewPreviewItemDto[];
  recommendations: SpaceRecommendationCardDto[];
};

/** GET /api/v1/spaces/{slug}/calendar?month=YYYY-MM */
export type SpaceCalendarResponseDto = {
  yearMonth: string;
  bookableDayOfMonth: number[];
};

export type SpaceAvailabilitySlotDto = {
  startTime: string;
  endTime: string;
  bookable: boolean;
  priceWon: number;
  slotId: string;
};

/** GET /api/v1/spaces/{slug}/availability?date= */
export type SpaceAvailabilityResponseDto = {
  date: string;
  slots: SpaceAvailabilitySlotDto[];
  timezone: string;
};

export type SpaceOptionItemDto = {
  id: string;
  name: string;
  priceWon: number;
  imageUrl?: string;
};

/** GET /api/v1/spaces/{slug}/options */
export type SpaceOptionsResponseDto = {
  options: SpaceOptionItemDto[];
};

/** POST /api/v1/spaces/{slug}/bookmarks — 스크랩 */
export type SpaceBookmarkToggleResponseDto = {
  saved: boolean;
};
