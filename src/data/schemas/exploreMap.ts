/**
 * UC-06 지도 탐색
 * @see docs/BACKEND_API.md §5
 */

import type { ApiOffsetPageDto } from './common';

export type ExploreMapMarkerDto = {
  id: string;
  lat: number;
  lng: number;
  availableRoomCount: number;
  spaceOrVendorId: string;
  label: string;
};

export type ExploreMapMarkersResponseDto = {
  markers: ExploreMapMarkerDto[];
};

/** 사이드바 리스트 아이템 (문서 예시와 ExploreMapListItem 호환) */
export type ExploreMapSpaceListItemDto = {
  detailPath: string;
  imageUrl: string;
  spaceType: string;
  studio: string;
  title: string;
  rating: string;
  location: string;
  priceLabel: string;
  priceSuffix: string;
  tags: string[];
  bookmarkSaved: boolean;
};

export type ExploreMapSpacesResponseDto = ApiOffsetPageDto<ExploreMapSpaceListItemDto>;

export type ExploreMapPopularVendorDto = {
  slug: string;
  label: string;
  /** 그라데이션 CSS 또는 이미지 URL */
  avatarStyle: string;
};

export type ExploreMapPopularVendorsResponseDto = {
  vendors: ExploreMapPopularVendorDto[];
};
