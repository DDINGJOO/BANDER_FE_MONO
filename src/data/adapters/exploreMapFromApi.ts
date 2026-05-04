/**
 * 지도 API DTO → `src/data/exploreMap.ts` ExploreMapListItem
 */

import type { ExploreMapSpaceListItemDto } from '../schemas/exploreMap';
import type { ExploreMapListItem } from '../exploreMap';

export function exploreMapListItemFromDto(row: ExploreMapSpaceListItemDto): ExploreMapListItem {
  const [a, b] = row.tags ?? [];
  return {
    availableRoomCount: row.availableRoomCount,
    bookmarkSaved: row.bookmarkSaved,
    detailPath: row.detailPath || '#',
    image: row.imageUrl || '',
    location: row.location || '',
    priceLabel: row.priceLabel || '',
    priceSuffix: row.priceSuffix || '',
    rating: row.rating || '',
    spaceType: row.spaceType || '',
    studio: row.studio || '',
    title: row.title || '',
    tags: [a ?? '', b ?? ''] as [string, string],
  };
}
