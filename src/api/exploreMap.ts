import { getJson } from './client';
import type {
  ExploreMapMarkersResponseDto,
  ExploreMapPopularVendorsResponseDto,
  ExploreMapSpacesResponseDto,
} from '../data/schemas/exploreMap';

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined;

export type ExploreMapSearchParams = Record<string, QueryValue>;

function buildQuery(params: ExploreMapSearchParams): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== '') {
          search.append(key, String(item));
        }
      }
      continue;
    }

    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getExploreMapMarkers(params: ExploreMapSearchParams = {}) {
  return getJson<ExploreMapMarkersResponseDto>(`/api/v1/explore/map/markers${buildQuery(params)}`, {
    preserveAuthOnUnauthorized: true,
  });
}

export function getExploreMapSpaces(params: ExploreMapSearchParams = {}) {
  return getJson<ExploreMapSpacesResponseDto>(`/api/v1/explore/map/spaces${buildQuery(params)}`, {
    preserveAuthOnUnauthorized: true,
  });
}

export function getExploreMapPopularVendors(params: ExploreMapSearchParams = {}) {
  return getJson<ExploreMapPopularVendorsResponseDto>(
    `/api/v1/explore/map/popular-vendors${buildQuery(params)}`,
    {
      preserveAuthOnUnauthorized: true,
    }
  );
}
