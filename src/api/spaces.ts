import { getJson } from './client';

// --- Vendor (업체) ---

export type VendorBasicInfoRowDto = {
  field: string;
  primaryLine?: string;
  secondaryLine?: string;
  hoursLine?: string;
  dayLabel?: string;
  phone?: string;
  line?: string;
  value?: string;
  left?: string;
  right?: string;
  displayText?: string;
  href?: string;
};

export type VendorRoomCardDto = {
  roomId: string;
  slug: string;
  title: string;
  categoryLabel: string;
  imageUrl: string | null;
  /**
   * R1-I: denormalized mediaId of the first gallery image. Allows the FE to
   * call {@code resolveProfileImageUrl(ref, url)} so the URL column is
   * preferred but a legacy CDN-prefix fallback is possible. Null for legacy
   * rows or rooms with no images.
   */
  mediaId?: string | null;
  location: string | null;
  priceLabel: string;
  priceSuffix: string;
  rating: string | null;
  studioLabel: string;
  tags: string[];
};

export type VendorBusinessHourDto = {
  dayOfWeek: string;
  closed: boolean;
  openTime: string | null;
  closeTime: string | null;
};

export type VendorDetailDto = {
  vendorId: string;
  slug: string | null;
  ownerUserId: string;
  name: string;
  description: string | null;
  contactPhone: string | null;
  address: {
    roadAddress: string | null;
    detailAddress: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  parkingPolicy: {
    parkingType: string;
    parkingMethod: string | null;
    parkingFeeDescription: string | null;
  } | null;
  homepageUrls: string[];
  keywords: { primaryCategory: string; secondaryKeyword: string }[];
  businessHours: VendorBusinessHourDto[];
  holidays: unknown[];
  rooms: VendorRoomCardDto[];
  hashTags: string[];
  basicInfoRows: VendorBasicInfoRowDto[];
  primaryImageRef?: string | null;
  primaryImageUrl?: string | null;
};

export function fetchVendorDetail(slug: string) {
  return getJson<VendorDetailDto>(`/api/v1/vendors/slug/${encodeURIComponent(slug)}`);
}

// --- Space (룸/공간) ---

export type SpacePricingLineDto = { label: string; value: string };
export type SpaceOperatingDayDto = { weekday: string; hours: string; isToday: boolean };
export type SpaceFacilityChipDto = { key: string; label: string };
export type SpaceBenefitChipDto = { label: string };
export type SpaceNoticeDto = { title: string; body: string; imageUrl: string | null };
export type SpacePolicyDto = { title: string; body: string; imageUrl: string | null };
export type SpaceVendorInfoDto = {
  name: string;
  spaces: string | null;
  primaryImageRef?: string | null;
  primaryImageUrl?: string | null;
};

/**
 * R1-I: per-image payload from RoomDetailResponse.GalleryImage. The FE
 * prefers {@code imageUrl} (denormalized) and falls back to legacy
 * CDN-prefix construction via {@code resolveProfileImageUrl} only when null.
 */
export type SpaceGalleryImageDto = {
  imageUrl: string | null;
  mediaId: string | null;
  sortOrder: number;
};

export type SpaceReservationFieldDto = {
  fieldId: string;
  inputType: string;
  title: string;
  required: boolean;
  inputFrequency: string | null;
  sortOrder: number;
  options?: string[];
};

export type SpaceDetailDto = {
  id: string;
  studioId: string | null;
  slug: string;
  title: string;
  category: string | null;
  studioName: string;
  vendorSlug: string | null;
  location: string | null;
  address: string | null;
  stationDistanceLabel: string | null;
  rating: string | null;
  reviewCount: number;
  priceLabel: string;
  priceSuffix: string;
  pricingLines: SpacePricingLineDto[];
  hashTags: string[];
  operatingSummary: string | null;
  operatingWeek: SpaceOperatingDayDto[];
  galleryUrls: string[];
  /**
   * R1-I: per-image objects carrying (imageUrl, mediaId, sortOrder). Prefer
   * {@code images[].imageUrl} when rendering — it is the denormalized CDN URL
   * persisted on room_image (V17). {@code mediaId} is null for legacy rows.
   * {@code galleryUrls} is retained for back-compat reads.
   */
  images?: SpaceGalleryImageDto[];
  facilityChips: SpaceFacilityChipDto[];
  detailBenefitChips: SpaceBenefitChipDto[];
  notices: SpaceNoticeDto[];
  policies: SpacePolicyDto[];
  reservationFields?: SpaceReservationFieldDto[];
  description: string | null;
  couponStripLabel: string | null;
  trustBanner: string | null;
  vendor: SpaceVendorInfoDto;
  latitude: number | null;
  longitude: number | null;
};

export function fetchSpaceDetail(slug: string) {
  return getJson<SpaceDetailDto>(`/api/v1/spaces/slug/${encodeURIComponent(slug)}`);
}
