import { useEffect, useMemo, useState } from 'react';
import { fetchSpaceDetail, type SpaceDetailDto } from '../api/spaces';
import { isMockMode } from '../config/publicEnv';
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
  const facilityChips: SpaceDetailBenefitItem[] = dto.facilityChips.map((chip) => {
    const k = 'key' in chip ? chip.key : undefined;
    return {
      key: k && VALID_FEATURE_KEYS.has(k) ? k as SpaceSummaryFeatureKey : undefined,
      label: chip.label,
    };
  });

  const detailBenefits: SpaceDetailBenefitItem[] = dto.detailBenefitChips.map((chip) => ({
    key: undefined,
    label: chip.label,
  }));

  return {
    ...dto,
    gallery: dto.galleryUrls,
    studioName: dto.studioName,
    category: dto.category ?? '합주실',
    summaryHashTags: dto.hashTags,
    pricingLines: dto.pricingLines,
    operatingSummary: dto.operatingSummary ?? '',
    operatingWeek: dto.operatingWeek,
    facilityChips,
    detailBenefits,
    notices: dto.notices,
    policies: dto.policies,
    couponStripLabel: dto.couponStripLabel ?? '',
    trustBanner: dto.trustBanner ?? '',
    priceTeaserSuffix: dto.priceSuffix ?? '',
    stationDistance: dto.stationDistanceLabel ?? '',
    address: dto.address ?? '',
    location: dto.location ?? '',
    mapLocation: { lat: 0, lng: 0 },
    reviewSummary: [] as Array<{ author: string; date: string; rating: string; text: string; photoCount?: number }>,
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
  const [error, setError] = useState<Error | null>(null);
  const mock = isMockMode();

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    if (mock) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSpaceDetail(slug)
      .then((data) => {
        if (!cancelled) {
          setApiData(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load space'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug, mock]);

  return useMemo(() => {
    if (mock) {
      return { ...buildMockDetail(slug), loading, error };
    }

    const detail = apiData ? mapApiToViewModel(apiData) : null;
    const vendorSlug = apiData?.vendorSlug ?? null;
    return { detail, slug: slug ?? '', vendorSlug, loading, error };
  }, [slug, apiData, loading, error, mock]);
}
