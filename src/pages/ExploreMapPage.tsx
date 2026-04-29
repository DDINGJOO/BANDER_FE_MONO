import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeHeader } from '../components/home/HomeHeader';
import { KakaoMapView } from '../components/map/KakaoMapView';
import { HomeSpaceExplorer, type SpaceFilterState } from '../components/home/HomeSpaceExplorer';
import { StarIcon } from '../components/shared/Icons';
import {
  getExploreMapMarkers,
  getExploreMapPopularVendors,
  getExploreMapSpaces,
  type ExploreMapSearchParams,
} from '../api/exploreMap';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { exploreMapListItemFromDto } from '../data/adapters/exploreMapFromApi';
import { loadAuthSession } from '../data/authSession';
import {
  EXPLORE_MAP_CENTER,
  type ExploreMapListItem,
  type ExploreMapMarker,
  type ExploreMapPopularVendor,
} from '../data/exploreMap';
import type { ExploreMapMarkerDto } from '../data/schemas/exploreMap';

function BookmarkGlyph({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden fill="none" height={28} viewBox="0 0 28 28" width={28}>
      <path
        d="M9 6.5C9 5.67 9.67 5 10.5 5H17.5C18.33 5 19 5.67 19 6.5V22L14 18.3L9 22V6.5Z"
        fill={filled ? '#24262c' : 'none'}
        stroke={filled ? '#24262c' : '#a3a9b5'}
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function RecenterIcon() {
  return (
    <svg aria-hidden fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v4M12 15v4M5 12h4M15 12h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function normalizeSpaceFilters(filters: SpaceFilterState): SpaceFilterState {
  const next: SpaceFilterState = {};

  if (filters.category) {
    next.category = filters.category;
  }
  if (filters.capacity) {
    next.capacity = filters.capacity;
  }
  if (filters.parking !== undefined) {
    next.parking = filters.parking;
  }
  if (filters.regions?.length) {
    next.regions = filters.regions;
  }
  if (filters.keywords?.length) {
    next.keywords = filters.keywords;
  }

  return next;
}

function buildExploreMapFilterParams(filters: SpaceFilterState): ExploreMapSearchParams {
  const cleanKeywords = filters.keywords?.map((keyword) => keyword.replace(/^#/, '')).filter(Boolean) ?? [];
  const params: ExploreMapSearchParams = {};

  if (filters.category) {
    params.category = filters.category;
  }
  if (filters.capacity) {
    params.capacity = filters.capacity;
  }
  if (filters.parking !== undefined) {
    params.parking = filters.parking;
  }
  if (filters.regions?.length) {
    params.region = filters.regions[0];
  }
  if (cleanKeywords.length) {
    params.keywords = cleanKeywords;
  }

  return params;
}

function exploreMapMarkerFromDto(row: ExploreMapMarkerDto): ExploreMapMarker | null {
  const lat = Number(row.lat);
  const lng = Number(row.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    detailPath: row.spaceOrVendorId ? `/spaces/${encodeURIComponent(row.spaceOrVendorId)}` : '#',
    lat,
    lng,
    title: row.label,
  };
}

function isExploreMapMarker(marker: ExploreMapMarker | null): marker is ExploreMapMarker {
  return marker !== null;
}

export function ExploreMapPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('합주');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [spaceFilters, setSpaceFilters] = useState<SpaceFilterState>({});
  const [listItems, setListItems] = useState<ExploreMapListItem[]>([]);
  const [mapMarkers, setMapMarkers] = useState<ExploreMapMarker[]>([]);
  const [popularVendors, setPopularVendors] = useState<ExploreMapPopularVendor[]>([]);
  const [savedByPath, setSavedByPath] = useState<Record<string, boolean>>({});

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const handleFilterChange = useCallback((filters: SpaceFilterState) => {
    const next = normalizeSpaceFilters(filters);
    setSpaceFilters((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
  }, []);

  const handleSearchSubmit = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(normalizedValue)}`);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!headerSearchRef.current?.contains(target)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = buildExploreMapFilterParams(spaceFilters);

    Promise.all([
      getExploreMapSpaces({ ...params, page: 0, size: 20 }).catch(() => null),
      getExploreMapMarkers(params).catch(() => null),
      getExploreMapPopularVendors(params).catch(() => null),
    ]).then(([spacesResponse, markersResponse, popularVendorsResponse]) => {
      if (cancelled) {
        return;
      }

      setListItems((spacesResponse?.items ?? []).map(exploreMapListItemFromDto));
      setMapMarkers((markersResponse?.markers ?? []).map(exploreMapMarkerFromDto).filter(isExploreMapMarker));
      setPopularVendors(popularVendorsResponse?.vendors ?? []);
    });

    return () => {
      cancelled = true;
    };
  }, [spaceFilters]);

  useEffect(() => {
    setSavedByPath((current) => {
      const next: Record<string, boolean> = {};
      for (const item of listItems) {
        next[item.detailPath] = current[item.detailPath] ?? item.bookmarkSaved;
      }
      return next;
    });
  }, [listItems]);

  const hasListItems = listItems.length > 0;
  const hasPopularVendors = popularVendors.length > 0;

  return (
    <main className="explore-map-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate('/login')}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() => setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))}
        onSearchSubmit={handleSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          handleSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="explore-map-page__body">
        <aside className="explore-map-page__sidebar">
          <div className="explore-map-page__explorer">
            <HomeSpaceExplorer onFilterChange={handleFilterChange} variant="map" />
          </div>

          {hasListItems ? (
            <button
              aria-controls="explore-map-visible-list"
              aria-expanded={mobileListOpen}
              aria-label={`지도 안 합주실 ${listItems.length}곳 ${mobileListOpen ? '접기' : '목록 보기'}`}
              className="explore-map-page__mobile-list-toggle"
              onClick={() => setMobileListOpen((open) => !open)}
              type="button"
            >
              <span>지도 안 합주실 {listItems.length}곳</span>
              <span aria-hidden>{mobileListOpen ? '접기' : '목록 보기'}</span>
            </button>
          ) : null}

          {hasListItems ? (
            <div
              className={`explore-map-page__list${mobileListOpen ? ' explore-map-page__list--mobile-open' : ''}`}
              id="explore-map-visible-list"
            >
              {listItems.map((item) => {
                const saved = savedByPath[item.detailPath] ?? false;
                const visibleTags = item.tags.filter(Boolean);
                return (
                  <div className="explore-map-card" key={item.detailPath}>
                    <div className="explore-map-card__row">
                      <Link className="explore-map-card__link" to={item.detailPath}>
                        <img alt="" className="explore-map-card__thumb" src={item.image} />
                        <div className="explore-map-card__stack">
                          <div className="explore-map-card__top">
                            <div className="explore-map-card__text">
                              <div className="explore-map-card__meta">
                                <span>{item.spaceType}</span>
                                <span className="explore-map-card__dot" />
                                <span>{item.studio}</span>
                              </div>
                              <span className="explore-map-card__title">{item.title}</span>
                              <div className="explore-map-card__rating-row">
                                <StarIcon />
                                <span className="explore-map-card__rating">{item.rating}</span>
                                <span className="explore-map-card__dot" />
                                <span className="explore-map-card__location">{item.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="explore-map-card__bottom">
                            <span className="explore-map-card__price-wrap">
                              <span className="explore-map-card__price">{item.priceLabel}</span>
                              <span className="explore-map-card__price-suffix">{item.priceSuffix}</span>
                            </span>
                            {visibleTags.length > 0 ? (
                              <div className="explore-map-card__tags">
                                {visibleTags.map((tag, index) => (
                                  <React.Fragment key={`${tag}-${index}`}>
                                    {index > 0 ? <span className="explore-map-card__dot" /> : null}
                                    <span>{tag}</span>
                                  </React.Fragment>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                      <button
                        aria-label={saved ? '스크랩 해제' : '스크랩'}
                        className="explore-map-card__bookmark"
                        onClick={() =>
                          setSavedByPath((prev) => ({
                            ...prev,
                            [item.detailPath]: !saved,
                          }))
                        }
                        type="button"
                      >
                        <BookmarkGlyph filled={saved} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {hasPopularVendors ? (
            <section className="explore-map-page__popular">
              <h2 className="explore-map-page__popular-title">인기 합주실</h2>
              <div className="explore-map-page__popular-scroll">
                {popularVendors.map((v) => (
                  <Link className="explore-map-page__popular-item" key={v.slug} to={`/vendors/${v.slug}`}>
                    <div className="explore-map-page__popular-ring">
                      <div
                        aria-hidden
                        className="explore-map-page__popular-avatar"
                        style={{ background: v.avatarStyle }}
                      />
                    </div>
                    <span className="explore-map-page__popular-label">{v.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>

        <div className="explore-map-page__map-wrap">
          <KakaoMapView
            center={EXPLORE_MAP_CENTER}
            className="explore-map-page__map-frame"
            key={mapResetKey}
            level={5}
            markers={mapMarkers}
            title="지도: 서울 마포구 인근"
          />
          <button
            aria-label="지도 위치 초기화"
            className="explore-map-page__recenter"
            onClick={() => setMapResetKey((prev) => prev + 1)}
            type="button"
          >
            <RecenterIcon />
          </button>
        </div>
      </div>
    </main>
  );
}
