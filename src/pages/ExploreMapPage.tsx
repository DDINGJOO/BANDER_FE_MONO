import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeHeader } from '../components/home/HomeHeader';
import { KakaoMapView } from '../components/map/KakaoMapView';
import { HomeSpaceExplorer, type SpaceFilterState } from '../components/home/HomeSpaceExplorer';
import { StarIcon } from '../components/shared/Icons';
import { fetchVendorDetail, type VendorDetailDto } from '../api/spaces';
import {
  getExploreMapMarkers,
  getExploreMapPopularVendors,
  getExploreMapSpaces,
  type ExploreMapSearchParams,
} from '../api/exploreMap';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { exploreMapListItemFromDto } from '../data/adapters/exploreMapFromApi';
import { loadAuthSession } from '../data/authSession';
import { parseSearchFilters, serializeSearchFilters } from '../lib/searchQuery';
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

function buildExploreMapFilterParams(filters: SpaceFilterState, query: string): ExploreMapSearchParams {
  const cleanKeywords = filters.keywords?.map((keyword) => keyword.replace(/^#/, '')).filter(Boolean) ?? [];
  const params: ExploreMapSearchParams = {};
  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.q = trimmedQuery;
  }

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
    availableRoomCount: row.availableRoomCount,
    detailPath: row.spaceOrVendorId ? `/vendors/${encodeURIComponent(row.spaceOrVendorId)}` : '#',
    lat,
    lng,
    title: row.label,
  };
}

function isExploreMapMarker(marker: ExploreMapMarker | null): marker is ExploreMapMarker {
  return marker !== null;
}

function vendorSlugFromDetailPath(detailPath: string): string | null {
  const match = detailPath.match(/^\/vendors\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function vendorHeroImage(vendor: VendorDetailDto | null, fallback?: ExploreMapListItem | null) {
  return vendor?.primaryImageUrl || vendor?.rooms.find((room) => room.imageUrl)?.imageUrl || fallback?.image || '';
}

export function ExploreMapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamString = searchParams.toString();
  const isAuthenticated = Boolean(loadAuthSession());
  const parsedSearch = useMemo(
    () => parseSearchFilters(new URLSearchParams(searchParamString)),
    [searchParamString],
  );
  const query = parsedSearch.q ?? '';
  const initialSpaceFilters = useMemo(() => parsedSearch.filters, [parsedSearch]);
  const initialSpaceFilterKey = useMemo(() => JSON.stringify(initialSpaceFilters), [initialSpaceFilters]);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState(query);
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [mapResetKey, setMapResetKey] = useState(0);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(EXPLORE_MAP_CENTER);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [spaceFilters, setSpaceFilters] = useState<SpaceFilterState>(initialSpaceFilters);
  const [listItems, setListItems] = useState<ExploreMapListItem[]>([]);
  const [mapMarkers, setMapMarkers] = useState<ExploreMapMarker[]>([]);
  const [popularVendors, setPopularVendors] = useState<ExploreMapPopularVendor[]>([]);
  const [savedByPath, setSavedByPath] = useState<Record<string, boolean>>({});
  const [selectedVendorSlug, setSelectedVendorSlug] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorDetailDto | null>(null);
  const [selectedVendorLoading, setSelectedVendorLoading] = useState(false);
  const [selectedVendorError, setSelectedVendorError] = useState(false);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const handleFilterChange = useCallback((filters: SpaceFilterState) => {
    setSpaceFilters((current) => (JSON.stringify(current) === JSON.stringify(filters) ? current : filters));
  }, []);

  const handleSearchSubmit = (value: string) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }
    const params = serializeSearchFilters(spaceFilters, normalizedValue);
    setSearchParams(params);
    setMobileListOpen(true);
  };

  useEffect(() => {
    setHeaderSearchQuery(query);
  }, [query]);

  useEffect(() => {
    setSpaceFilters((current) => (
      JSON.stringify(current) === initialSpaceFilterKey ? current : initialSpaceFilters
    ));
  }, [initialSpaceFilterKey, initialSpaceFilters]);

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
    const params = buildExploreMapFilterParams(normalizeSpaceFilters(spaceFilters), query);

    Promise.all([
      getExploreMapSpaces({ ...params, page: 0, size: 20 }).catch(() => null),
      getExploreMapMarkers(params).catch(() => null),
      getExploreMapPopularVendors(params).catch(() => null),
    ]).then(([spacesResponse, markersResponse, popularVendorsResponse]) => {
      if (cancelled) {
        return;
      }

      setListItems((spacesResponse?.items ?? []).map(exploreMapListItemFromDto));
      const nextMarkers = (markersResponse?.markers ?? []).map(exploreMapMarkerFromDto).filter(isExploreMapMarker);
      setMapMarkers(nextMarkers);
      setPopularVendors(popularVendorsResponse?.vendors ?? []);
      if (query.trim() && nextMarkers.length > 0) {
        setMapCenter({ lat: nextMarkers[0].lat, lng: nextMarkers[0].lng });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [query, spaceFilters]);

  useEffect(() => {
    setSavedByPath((current) => {
      const next: Record<string, boolean> = {};
      for (const item of listItems) {
        next[item.detailPath] = current[item.detailPath] ?? item.bookmarkSaved;
      }
      return next;
    });
  }, [listItems]);

  useEffect(() => {
    if (!selectedVendorSlug) {
      setSelectedVendor(null);
      setSelectedVendorLoading(false);
      setSelectedVendorError(false);
      return;
    }

    let cancelled = false;
    setSelectedVendor(null);
    setSelectedVendorLoading(true);
    setSelectedVendorError(false);

    fetchVendorDetail(selectedVendorSlug)
      .then((detail) => {
        if (!cancelled) {
          setSelectedVendor(detail);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedVendorError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSelectedVendorLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVendorSlug]);

  useEffect(() => {
    if (!selectedVendorSlug) {
      return;
    }
    const stillVisible = listItems.some((item) => vendorSlugFromDetailPath(item.detailPath) === selectedVendorSlug);
    if (!stillVisible) {
      setSelectedVendorSlug(null);
    }
  }, [listItems, selectedVendorSlug]);

  const hasListItems = listItems.length > 0;
  const hasPopularVendors = popularVendors.length > 0;
  const selectedListItem = selectedVendorSlug
    ? listItems.find((item) => vendorSlugFromDetailPath(item.detailPath) === selectedVendorSlug) ?? null
    : null;
  const selectedHeroImage = vendorHeroImage(selectedVendor, selectedListItem);

  const openVendorDetail = useCallback((slug: string | null) => {
    if (!slug) {
      return;
    }
    setSelectedVendorSlug(slug);
    setMobileListOpen(false);
  }, []);

  const kakaoMarkers = useMemo(
    () =>
      mapMarkers.map((m) => ({
        ...m,
        pinStyle:
          (selectedVendorSlug && vendorSlugFromDetailPath(m.detailPath) === selectedVendorSlug
            ? 'active'
            : 'default') as 'active' | 'default',
        label:
          typeof m.availableRoomCount === 'number' && m.availableRoomCount > 0
            ? `공간 ${m.availableRoomCount}`
            : undefined,
      })),
    [mapMarkers, selectedVendorSlug],
  );

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
            <HomeSpaceExplorer
              initialFilters={initialSpaceFilters}
              initialSearchQuery={query}
              key={initialSpaceFilterKey}
              onFilterChange={handleFilterChange}
              searchBasePath="/search/map"
              variant="map"
            />
          </div>

          {hasListItems ? (
            <button
              aria-controls="explore-map-visible-list"
              aria-expanded={mobileListOpen}
              aria-label={`지도 안 업체 ${listItems.length}곳 ${mobileListOpen ? '접기' : '목록 보기'}`}
              className="explore-map-page__mobile-list-toggle"
              onClick={() => setMobileListOpen((open) => !open)}
              type="button"
            >
              <span>지도 안 업체 {listItems.length}곳</span>
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
                      <button
                        className="explore-map-card__link"
                        onClick={() => openVendorDetail(vendorSlugFromDetailPath(item.detailPath))}
                        type="button"
                      >
                        {item.image ? (
                          <img alt="" className="explore-map-card__thumb" src={item.image} />
                        ) : (
                          <div aria-hidden className="explore-map-card__thumb explore-map-card__thumb--placeholder" />
                        )}
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
                                {item.rating ? (
                                  <>
                                    <StarIcon />
                                    <span className="explore-map-card__rating">{item.rating}</span>
                                    <span className="explore-map-card__dot" />
                                  </>
                                ) : null}
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
                      </button>
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

        {selectedVendorSlug ? (
          <section className="explore-map-detail" aria-label="업체 상세 정보">
            <div className="explore-map-detail__head">
              <button
                className="explore-map-detail__back"
                onClick={() => setSelectedVendorSlug(null)}
                type="button"
              >
                목록
              </button>
              <Link className="explore-map-detail__full-link" to={`/vendors/${selectedVendorSlug}`}>
                전체 상세
              </Link>
            </div>

            {selectedVendorError ? (
              <div className="explore-map-detail__state">업체 정보를 불러오지 못했습니다.</div>
            ) : (
              <>
                {selectedHeroImage ? (
                  <img alt="" className="explore-map-detail__hero" src={selectedHeroImage} />
                ) : (
                  <div aria-hidden className="explore-map-detail__hero explore-map-detail__hero--placeholder" />
                )}

                <div className="explore-map-detail__body">
                  <p className="explore-map-detail__eyebrow">
                    {selectedVendor
                      ? `${selectedVendor.rooms.length}개 공간`
                      : selectedListItem?.studio ?? '업체 정보'}
                  </p>
                  <h2 className="explore-map-detail__title">
                    {selectedVendor?.name ?? selectedListItem?.title ?? '업체'}
                  </h2>
                  <p className="explore-map-detail__address">
                    {selectedVendor?.address?.roadAddress ?? selectedListItem?.location ?? ''}
                  </p>

                  {selectedVendorLoading ? (
                    <div className="explore-map-detail__state">상세 정보를 불러오는 중입니다.</div>
                  ) : null}

                  {selectedVendor?.description ? (
                    <p className="explore-map-detail__description">{selectedVendor.description}</p>
                  ) : null}

                  {selectedVendor?.hashTags.length ? (
                    <div className="explore-map-detail__chips" aria-label="업체 태그">
                      {selectedVendor.hashTags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}

                  <section className="explore-map-detail__section">
                    <h3>공간</h3>
                    {selectedVendor?.rooms.length ? (
                      <div className="explore-map-detail__rooms">
                        {selectedVendor.rooms.map((room) => (
                          <Link className="explore-map-detail__room" key={room.slug} to={`/spaces/${room.slug}`}>
                            {room.imageUrl ? (
                              <img alt="" src={room.imageUrl} />
                            ) : (
                              <span aria-hidden className="explore-map-detail__room-placeholder" />
                            )}
                            <span className="explore-map-detail__room-copy">
                              <strong>{room.title}</strong>
                              <span>{room.priceLabel}{room.priceSuffix}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : selectedVendorLoading ? null : (
                      <p className="explore-map-detail__empty">등록된 공간이 없습니다.</p>
                    )}
                  </section>
                </div>
              </>
            )}
          </section>
        ) : null}

        <div className="explore-map-page__map-wrap">
          <KakaoMapView
            center={mapCenter}
            className="explore-map-page__map-frame"
            key={mapResetKey}
            level={5}
            markers={kakaoMarkers}
            onMarkerClick={(marker) => {
              openVendorDetail(marker.detailPath ? vendorSlugFromDetailPath(marker.detailPath) : null);
              setMapCenter({ lat: marker.lat, lng: marker.lng });
            }}
            title="지도: 서울 마포구 인근"
          />
          <button
            aria-label="지도 위치 초기화"
            className="explore-map-page__recenter"
            onClick={() => {
              setMapCenter(EXPLORE_MAP_CENTER);
              setMapResetKey((prev) => prev + 1);
            }}
            type="button"
          >
            <RecenterIcon />
          </button>
        </div>
      </div>
    </main>
  );
}
