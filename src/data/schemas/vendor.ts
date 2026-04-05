/**
 * UC-08 업체(벤더) 상세
 * @see docs/BACKEND_API.md §7
 */

/** 기본 정보 한 행 — field 문자열 + variant 필드 (프론트 VendorBasicInfo 행과 매핑) */
export type VendorBasicInfoRowDto = {
  field: string;
  primaryLine?: string;
  secondaryLine?: string;
  hoursLine?: string;
  phone?: string;
  line?: string;
  value?: string;
  left?: string;
  right?: string;
  linkLabel?: string;
  href?: string;
};

export type VendorRoomCardDto = {
  detailPath: string;
  title: string;
  categoryLabel: string;
  imageUrl: string;
  location: string;
  priceLabel: string;
  priceSuffix: string;
  rating: string;
  studioLabel: string;
  tags: string[];
};

/** GET /api/v1/vendors/{slug} */
export type VendorDetailResponseDto = {
  slug: string;
  name: string;
  description: string;
  heroImageUrl: string;
  mapImageUrl?: string;
  distanceLabel?: string;
  fullAddress: string;
  hashTags: string[];
  reviewCountLabel: string;
  reviewSectionCount: number;
  policyLinkLabel?: string;
  timeNote?: string;
  basicInfoRows: VendorBasicInfoRowDto[];
  rooms: VendorRoomCardDto[];
  reviews: unknown[];
};
