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

/**
 * R1-I: per-image payload mirroring RoomDetailResponse.GalleryImage from
 * space-service. {@code imageUrl} is the denormalized CDN URL persisted on
 * room_image (V17). FE prefers it over reconstructing from {@code mediaId}.
 */
export type SpaceGalleryImageDto = {
  imageUrl: string | null;
  mediaId: string | null;
  sortOrder: number;
};

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
  /**
   * R1-I: per-image objects from RoomDetailResponse.GalleryImage.
   * Prefer {@code images[].imageUrl} over the parallel {@code galleryUrls} array.
   */
  images?: SpaceGalleryImageDto[];
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
