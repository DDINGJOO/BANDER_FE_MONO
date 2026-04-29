import { getJson } from './client';
import type {
  ExploreMapMarkersResponseDto,
  ExploreMapPopularVendorsResponseDto,
  ExploreMapSpacesResponseDto,
} from '../data/schemas/exploreMap';

type ExploreMapParams = {
  page?: number;
  region?: string;
  size?: number;
};

function buildQuery(params: ExploreMapParams): string {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  if (entries.length === 0) {
    return '';
  }

  return `?${entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')}`;
}

export function fetchExploreMapMarkers(params: Pick<ExploreMapParams, 'region'> = {}) {
  return getJson<ExploreMapMarkersResponseDto>(`/api/v1/spaces/map/markers${buildQuery(params)}`);
}

export function fetchExploreMapSpaces(params: ExploreMapParams = {}) {
  return getJson<ExploreMapSpacesResponseDto>(`/api/v1/spaces/map/spaces${buildQuery(params)}`);
}

export function fetchExploreMapPopularVendors(params: Pick<ExploreMapParams, 'region' | 'size'> = {}) {
  return getJson<ExploreMapPopularVendorsResponseDto>(
    `/api/v1/spaces/map/popular-vendors${buildQuery(params)}`
  );
}
