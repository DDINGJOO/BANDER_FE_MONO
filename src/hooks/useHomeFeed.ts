import { useEffect, useState, useMemo } from 'react';
import { fetchHomeFeed } from '../api/home';
import { isMockMode } from '../config/publicEnv';
import { normalizeHomeFeedForUi } from '../data/adapters/homeFromApi';
import type { HomeFeedResponseDto } from '../data/schemas/homeFeed';

export function useHomeFeed() {
  const [apiData, setApiData] = useState<HomeFeedResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mock = isMockMode();

  useEffect(() => {
    if (mock) {
      setApiData(null);
      setError(null);
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
        hotPosts: [],
        recommendedSpaces: [],
        reviewCards: [],
        categoryBubbles: [],
        vendorCards: [],
        loading: false,
        error: null,
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
