import { useEffect, useMemo, useState } from 'react';
import { getJson } from '../api/client';
import { fetchSpaceDetail, type SpaceDetailDto, type SpaceGalleryImageDto } from '../api/spaces';
import { resolveProfileImageUrl } from '../config/media';
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

  // detailBenefits를 facilityChips에 통합 (중복 제거)
  const benefitLabels = new Set(facilityChips.map((c) => c.label));
  const mergedBenefits: SpaceDetailBenefitItem[] = dto.detailBenefitChips
    .filter((chip) => !benefitLabels.has(chip.label))
    .map((chip) => ({ key: undefined, label: chip.label }));
  const allFacilities = [...facilityChips, ...mergedBenefits];

  // notices/policies에 imageUrl 보장
  const notices = dto.notices.map((n) => ({
    title: n.title,
    body: n.body,
    imageUrl: n.imageUrl ?? null,
  }));
  const policies = dto.policies.map((p) => ({
    title: p.title,
    body: p.body,
    imageUrl: p.imageUrl ?? null,
  }));

  // R1-I: prefer per-image (imageUrl, mediaId) lockstep payload over the
  // legacy galleryUrls parallel-array. resolveProfileImageUrl handles both
  // the new V17 column (imageUrl present) and legacy rows (mediaId-only,
  // CDN-prefix fallback).
  const galleryFromImages = (dto.images ?? []) as SpaceGalleryImageDto[];
  const gallery = galleryFromImages.length > 0
    ? galleryFromImages
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((img) => resolveProfileImageUrl(img.mediaId ?? null, img.imageUrl ?? null))
    : dto.galleryUrls;
  const studioThumbnailUrl = dto.vendor?.primaryImageUrl?.trim()
    ? resolveProfileImageUrl(dto.vendor.primaryImageRef ?? null, dto.vendor.primaryImageUrl)
    : null;

  return {
    ...dto,
    gallery,
    studioName: dto.studioName,
    category: dto.category ?? '합주실',
    summaryHashTags: dto.hashTags,
    pricingLines: dto.pricingLines,
    operatingSummary: dto.operatingSummary ?? '',
    operatingWeek: dto.operatingWeek,
    facilityChips: allFacilities,
    detailBenefits: [] as SpaceDetailBenefitItem[],
    notices,
    policies,
    couponStripLabel: dto.couponStripLabel || '사용 가능한 쿠폰',
    trustBanner: dto.trustBanner || null,
    priceTeaserSuffix: dto.priceSuffix ?? '',
    stationDistance: dto.stationDistanceLabel ?? '',
    address: dto.address ?? '',
    location: dto.location ?? '',
    mapLocation: { lat: dto.latitude ?? 0, lng: dto.longitude ?? 0 },
    reviewSummary: [] as Array<{ author: string; date: string; rating: string; text: string; photoCount?: number }>,
    studioId: dto.studioId ?? null,
    vendor: {
      name: dto.vendor?.name ?? dto.studioName,
      spaces: dto.vendor?.spaces ?? '',
      thumbnailUrl: studioThumbnailUrl,
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
      thumbnailUrl: spaceCard.image,
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

type ReviewItem = { reviewId: string; userId: string; rating: number; content: string; createdAt: string };
type ReviewApiResponse = { items: ReviewItem[] };

function formatReviewDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function useSpaceDetail(slug: string | undefined) {
  const [apiData, setApiData] = useState<SpaceDetailDto | null>(null);
  const [reviews, setReviews] = useState<Array<{ author: string; date: string; rating: string; text: string; photoCount?: number }>>([]);
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
      .then(async (data) => {
        if (cancelled) return;
        setApiData(data);

        // Fetch reviews for this specific room
        const studioId = data.studioId;
        const roomId = data.id;
        if (studioId && roomId) {
          try {
            const reviewData = await getJson<ReviewApiResponse>(
              `/api/v1/spaces/${encodeURIComponent(studioId)}/reviews?roomId=${encodeURIComponent(roomId)}`
            );
            if (!cancelled && reviewData?.items) {
              setReviews(reviewData.items.map((r) => ({
                author: '[BACKEND] 사용자',
                date: formatReviewDate(r.createdAt),
                rating: String(r.rating),
                text: r.content,
              })));
            }
          } catch {
            // Reviews are optional
          }
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
    if (detail) {
      detail.reviewSummary = reviews;
    }
    const vendorSlug = apiData?.vendorSlug ?? null;
    return { detail, slug: slug ?? '', vendorSlug, loading, error };
  }, [slug, apiData, reviews, loading, error, mock]);
}
