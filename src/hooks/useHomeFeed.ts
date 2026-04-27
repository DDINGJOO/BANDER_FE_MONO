import { useEffect, useState, useMemo } from 'react';
import { fetchHomeFeed } from '../api/home';
import { isMockMode } from '../config/publicEnv';
import {
  HOME_CATEGORY_BUBBLES,
  HOME_HOT_POSTS,
  HOME_REVIEW_CARDS,
  HOME_SPACE_CARDS,
} from '../data/home';
import { normalizeHomeFeedForUi } from '../data/adapters/homeFromApi';
import type { HomeFeedResponseDto } from '../data/schemas/homeFeed';

export function useHomeFeed() {
  const [apiData, setApiData] = useState<HomeFeedResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mock = isMockMode();

  useEffect(() => {
    if (mock) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchHomeFeed()
      .then((data) => {
        if (!cancelled) setApiData(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Failed to load home feed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [mock]);

  return useMemo(() => {
    if (mock) {
      return {
        hotPosts: HOME_HOT_POSTS,
        recommendedSpaces: HOME_SPACE_CARDS,
        reviewCards: HOME_REVIEW_CARDS,
        categoryBubbles: HOME_CATEGORY_BUBBLES,
        vendorCards: [],
        loading: false,
        error,
      };
    }

    if (error) {
      return {
        hotPosts: [],
        recommendedSpaces: [],
        reviewCards: [],
        categoryBubbles: [],
        vendorCards: [],
        loading: false,
        error,
      };
    }

    if (loading || !apiData) {
      return {
        hotPosts: [],
        recommendedSpaces: [],
        reviewCards: [],
        categoryBubbles: [],
        vendorCards: [],
        loading,
        error: null,
      };
    }

    const normalized = normalizeHomeFeedForUi(apiData);
    return {
      hotPosts: normalized.hotPosts,
      recommendedSpaces: normalized.recommendedSpaces,
      reviewCards: normalized.reviewCards,
      categoryBubbles: normalized.categoryBubbles,
      vendorCards: normalized.vendorCards,
      loading: false,
      error: null,
    };
  }, [apiData, loading, error, mock]);
}
