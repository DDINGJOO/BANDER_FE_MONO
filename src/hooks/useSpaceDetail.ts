import { useMemo } from 'react';
import { HOME_SPACE_CARDS } from '../data/home';
import {
  ROOM_DETAIL_DATA,
  SPACE_DETAIL_MAP_SEARCH_PLACEHOLDER,
  SPACE_DETAIL_NOTICES,
  SPACE_DETAIL_OPERATING_SUMMARY,
  SPACE_DETAIL_PRICING_LINES,
  SPACE_DETAIL_STATION_DISTANCE,
  SPACE_DETAIL_TRUST_BANNER,
} from '../data/spaceDetail';

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
      location: spaceCard.location,
      mapSearchPlaceholder: SPACE_DETAIL_MAP_SEARCH_PLACEHOLDER,
      notices: SPACE_DETAIL_NOTICES,
      operatingSummary: SPACE_DETAIL_OPERATING_SUMMARY,
      priceLabel: `${spaceCard.price}~`,
      pricingLines: SPACE_DETAIL_PRICING_LINES,
      stationDistance: SPACE_DETAIL_STATION_DISTANCE,
      studioName: spaceCard.studio,
      title: spaceCard.title,
      trustBanner: SPACE_DETAIL_TRUST_BANNER,
    };

    return { detail, slug: slug ?? '', spaceCard };
  }, [slug]);
}
