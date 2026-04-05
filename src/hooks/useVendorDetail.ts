import { useEffect, useState } from 'react';
import { fetchVendorDetail, type VendorDetailDto } from '../api/spaces';
import { getVendorDetail as getMockVendorDetail, type VendorDetailModel } from '../data/vendorDetail';
import type { VendorBasicInfoRow } from '../types/vendorBasicInfo';

function mapBasicInfoRow(dto: VendorDetailDto['basicInfoRows'][number]): VendorBasicInfoRow {
  switch (dto.field) {
    case 'address':
      return {
        field: 'address',
        primaryLine: dto.primaryLine ?? '',
        ...(dto.secondaryLine ? { secondaryLine: dto.secondaryLine } : {}),
      };
    case 'hours':
      return { field: 'hours', dayLabel: dto.dayLabel, hoursLine: dto.hoursLine ?? '' };
    case 'phone':
      return { field: 'phone', phone: dto.phone ?? '' };
    case 'parking':
      return dto.right
        ? { field: 'parking', left: dto.left ?? '', right: dto.right }
        : { field: 'custom', label: '주차정보', value: dto.left ?? '' };
    case 'extra_link':
      return { field: 'extra_link', displayText: dto.displayText ?? dto.href ?? '', href: dto.href ?? '' };
    case 'price':
      return { field: 'price', line: dto.line ?? dto.value ?? '' };
    case 'capacity':
      return { field: 'capacity', value: dto.value ?? '' };
    case 'directions':
      return { field: 'directions', primaryLine: dto.primaryLine ?? '' };
    default:
      return { field: 'custom', label: dto.field, value: dto.value ?? dto.primaryLine ?? '' };
  }
}

function mapApiToVendorModel(dto: VendorDetailDto): VendorDetailModel {
  const firstRoomImage = dto.rooms.length > 0 && dto.rooms[0].imageUrl
    ? dto.rooms[0].imageUrl
    : '';

  const lat = dto.address?.latitude ?? 37.5562;
  const lng = dto.address?.longitude ?? 126.9229;

  return {
    name: dto.name,
    description: dto.description ?? '',
    distanceLabel: '',
    fullAddress: dto.address
      ? [dto.address.roadAddress, dto.address.detailAddress].filter(Boolean).join(' ')
      : '',
    hashTags: dto.hashTags,
    heroImage: firstRoomImage,
    mapImage: '',
    mapLocation: { lat, lng },
    policyLinkLabel: '이용정책 확인',
    reviewCountLabel: '',
    reviewSectionCount: 0,
    reviews: [],
    rooms: dto.rooms.map((room) => ({
      categoryLabel: room.categoryLabel ?? '',
      detailPath: `/spaces/${room.slug}`,
      image: room.imageUrl ?? '',
      location: room.location ?? '',
      priceLabel: room.priceLabel,
      priceSuffix: room.priceSuffix,
      rating: room.rating ?? '',
      studioLabel: room.studioLabel,
      tags: room.tags,
      title: room.title,
    })),
    basicInfoRows: dto.basicInfoRows.map(mapBasicInfoRow),
    timeNote: '최소 30분 단위로 선택',
  };
}

export function useVendorDetail(slug: string | undefined) {
  const [vendor, setVendor] = useState<VendorDetailModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setVendor(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchVendorDetail(slug)
      .then((dto) => {
        if (!cancelled) {
          setVendor(mapApiToVendorModel(dto));
        }
      })
      .catch(() => {
        // API 실패 시 mock fallback
        if (!cancelled) {
          setVendor(getMockVendorDetail(slug));
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
  }, [slug]);

  return { vendor, loading };
}
