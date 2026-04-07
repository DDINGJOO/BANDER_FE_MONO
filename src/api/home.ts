import { getJson } from './client';
import type { HomeFeedResponseDto } from '../data/schemas/homeFeed';

export function fetchHomeFeed() {
  return getJson<HomeFeedResponseDto>('/api/v1/home/feed');
}
