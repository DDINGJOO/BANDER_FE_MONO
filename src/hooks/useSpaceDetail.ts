import { useMemo } from 'react';
import { HOME_SPACE_CARDS } from '../data/home';
import {
  ROOM_DETAIL_DATA,
  SPACE_DETAIL_COUPON_STRIP_LABEL,
  SPACE_DETAIL_DETAIL_STRIP,
  SPACE_DETAIL_FACILITY_CHIPS,
  SPACE_DETAIL_NOTICES,
  SPACE_DETAIL_OPERATING_SUMMARY,
  SPACE_DETAIL_OPERATING_WEEK,
  SPACE_DETAIL_PRICING_LINES,
  SPACE_DETAIL_STATION_DISTANCE,
  SPACE_DETAIL_SUMMARY_HASH_TAGS,
  SPACE_DETAIL_SUMMARY_PRICE_SUFFIX,
  SPACE_DETAIL_TRUST_BANNER,
} from '../data/spaceDetail';
import { getVendorSlugForStudio } from '../data/vendorDetail';

/**
 * Slug 기준 공간 상세 뷰 모델. 추후 `GET /spaces/:slug` 응답을 여기서 매핑하면 됩니다.
 */
export function useSpaceDetail(slug: string | undefined) {
  return useMemo(() => {
    const path = slug ? `/spaces/${slug}` : '';
    const spaceCard =
      HOME_SPACE_CARDS.find((item) => item.detailPath === path) ?? HOME_SPACE_CARDS[1];

    const detail = {
      ...ROOM_DETAIL_DATA,
      category: spaceCard.subtitle,
      couponStripLabel: SPACE_DETAIL_COUPON_STRIP_LABEL,
      description: ROOM_DETAIL_DATA.description.replace(/\{\{STUDIO\}\}/g, spaceCard.studio),
      detailBenefits: SPACE_DETAIL_DETAIL_STRIP,
      facilityChips: SPACE_DETAIL_FACILITY_CHIPS,
      location: spaceCard.location,
      vendor: {
        ...ROOM_DETAIL_DATA.vendor,
        name: spaceCard.studio,
      },
      summaryHashTags: [...SPACE_DETAIL_SUMMARY_HASH_TAGS],
      notices: SPACE_DETAIL_NOTICES,
      operatingSummary: SPACE_DETAIL_OPERATING_SUMMARY,
      operatingWeek: SPACE_DETAIL_OPERATING_WEEK,
      priceLabel: `${spaceCard.price}~`,
      priceTeaserSuffix: SPACE_DETAIL_SUMMARY_PRICE_SUFFIX,
      pricingLines: SPACE_DETAIL_PRICING_LINES,
      stationDistance: SPACE_DETAIL_STATION_DISTANCE,
      studioName: spaceCard.studio,
      title: spaceCard.title,
      trustBanner: SPACE_DETAIL_TRUST_BANNER,
    };

    const vendorSlug = getVendorSlugForStudio(spaceCard.studio);

    return { detail, slug: slug ?? '', spaceCard, vendorSlug };
  }, [slug]);
}
