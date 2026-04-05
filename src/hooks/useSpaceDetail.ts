import { useEffect, useMemo, useState } from 'react';
import { fetchSpaceDetail, type SpaceDetailDto } from '../api/spaces';
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
import type { SpaceDetailBenefitItem, SpaceSummaryFeatureKey } from '../types/space';

const VALID_FEATURE_KEYS = new Set<string>(['parking', 'booking', 'hvac', 'wifi']);

function mapApiToViewModel(dto: SpaceDetailDto) {
  const facilityChips: SpaceDetailBenefitItem[] = (dto.facilityChips.length > 0 ? dto.facilityChips : SPACE_DETAIL_FACILITY_CHIPS)
    .map((chip) => {
      const k = 'key' in chip ? chip.key : undefined;
      return {
        key: k && VALID_FEATURE_KEYS.has(k) ? k as SpaceSummaryFeatureKey : undefined,
        label: chip.label,
      };
    });

  const detailBenefits: SpaceDetailBenefitItem[] = dto.detailBenefitChips.length > 0
    ? dto.detailBenefitChips.map((chip) => ({
        key: undefined,
        label: chip.label,
      }))
    : SPACE_DETAIL_DETAIL_STRIP;

  return {
    ...dto,
    gallery: dto.galleryUrls.length > 0 ? dto.galleryUrls : ROOM_DETAIL_DATA.gallery,
    studioName: dto.studioName,
    category: dto.category ?? '합주실',
    summaryHashTags: dto.hashTags.length > 0 ? dto.hashTags : [...SPACE_DETAIL_SUMMARY_HASH_TAGS],
    pricingLines: dto.pricingLines.length > 0 ? dto.pricingLines : SPACE_DETAIL_PRICING_LINES,
    operatingSummary: dto.operatingSummary ?? SPACE_DETAIL_OPERATING_SUMMARY,
    operatingWeek: dto.operatingWeek.length > 0 ? dto.operatingWeek : SPACE_DETAIL_OPERATING_WEEK,
    facilityChips,
    detailBenefits,
    notices: dto.notices.length > 0 ? dto.notices : SPACE_DETAIL_NOTICES,
    policies: dto.policies,
    couponStripLabel: dto.couponStripLabel ?? SPACE_DETAIL_COUPON_STRIP_LABEL,
    trustBanner: dto.trustBanner ?? SPACE_DETAIL_TRUST_BANNER,
    priceTeaserSuffix: dto.priceSuffix ?? SPACE_DETAIL_SUMMARY_PRICE_SUFFIX,
    stationDistance: dto.stationDistanceLabel ?? SPACE_DETAIL_STATION_DISTANCE,
    address: dto.address ?? '',
    location: dto.location ?? '',
    mapLocation: ROOM_DETAIL_DATA.mapLocation,
    reviewSummary: ROOM_DETAIL_DATA.reviewSummary,
    vendor: {
      name: dto.vendor?.name ?? dto.studioName,
      spaces: dto.vendor?.spaces ?? '',
    },
    descriptionCategoryLabel: '전체',
  };
}

function buildMockDetail(slug: string | undefined) {
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
}

export function useSpaceDetail(slug: string | undefined) {
  const [apiData, setApiData] = useState<SpaceDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchSpaceDetail(slug)
      .then((data) => {
        if (!cancelled) {
          setApiData(data);
        }
      })
      .catch(() => {
        // API 실패 시 mock fallback — 개발 중 안전망
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return useMemo(() => {
    if (apiData) {
      const detail = mapApiToViewModel(apiData);
      const vendorSlug = apiData.vendorSlug ?? null;
      const path = slug ? `/spaces/${slug}` : '';
      const spaceCard =
        HOME_SPACE_CARDS.find((item) => item.detailPath === path) ?? HOME_SPACE_CARDS[1];

      return { detail, slug: slug ?? '', spaceCard, vendorSlug, loading };
    }

    // mock fallback
    return { ...buildMockDetail(slug), loading };
  }, [slug, apiData, loading]);
}
