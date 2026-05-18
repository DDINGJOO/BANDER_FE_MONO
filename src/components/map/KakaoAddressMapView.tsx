import React, { useEffect, useRef, useState } from 'react';
import {
  MAP_MARKER_IMAGE_DEFAULT,
  MAP_MARKER_LAYOUT,
} from '../../data/mapPinAssets';
import { loadKakaoMapSdk } from '../../lib/kakaoMap';

type KakaoLatLng = {
  getLat: () => number;
  getLng: () => number;
};

type KakaoMapInstance = {
  relayout?: () => void;
  setCenter: (latLng: KakaoLatLng) => void;
};

type KakaoMarkerInstance = {
  setMap: (map: KakaoMapInstance | null) => void;
};

type KakaoSize = { height: number; width: number };

type KakaoPoint = { x: number; y: number };

type KakaoMarkerImage = unknown;

type KakaoAddressResult = {
  x: string;
  y: string;
};

type KakaoMapsNs = {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  Marker: new (options: {
    image?: KakaoMarkerImage;
    map: KakaoMapInstance;
    position: KakaoLatLng;
    title?: string;
    zIndex?: number;
  }) => KakaoMarkerInstance;
  MarkerImage: new (src: string, size: KakaoSize, options?: { offset: KakaoPoint }) => KakaoMarkerImage;
  Point: new (x: number, y: number) => KakaoPoint;
  Size: new (w: number, h: number) => KakaoSize;
  services?: {
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (result: KakaoAddressResult[], status: string) => void
      ) => void;
    };
    Status: {
      OK: string;
    };
  };
};

type KakaoWindow = Window & {
  kakao?: {
    maps: KakaoMapsNs;
  };
};

type Props = {
  address: string;
  center?: {
    lat: number | null;
    lng: number | null;
  } | null;
  className?: string;
  level?: number;
  markerTitle?: string;
  title: string;
};

function markerImage(maps: KakaoMapsNs): KakaoMarkerImage {
  return new maps.MarkerImage(
    MAP_MARKER_IMAGE_DEFAULT,
    new maps.Size(MAP_MARKER_LAYOUT.width, MAP_MARKER_LAYOUT.height),
    {
      offset: new maps.Point(MAP_MARKER_LAYOUT.anchorX, MAP_MARKER_LAYOUT.anchorY),
    }
  );
}

function addressSearchCandidates(address: string) {
  const candidates = [address];
  const withoutFloor = address
    .replace(/\s+(?:지하\s*)?\d+\s*층(?:\s*\d+\s*호)?\s*$/u, '')
    .replace(/\s+(?:B|b)\d+(?:\s*층)?(?:\s*\d+\s*호)?\s*$/u, '')
    .trim();
  if (withoutFloor && withoutFloor !== address) {
    candidates.push(withoutFloor);
  }

  const roadMatch = address.match(/^(.+?(?:로|길)\s*\d+(?:-\d+)?)/u);
  const roadAddress = roadMatch?.[1]?.trim();
  if (roadAddress && !candidates.includes(roadAddress)) {
    candidates.push(roadAddress);
  }
  return candidates;
}

function searchAddress(
  geocoder: InstanceType<NonNullable<KakaoMapsNs['services']>['Geocoder']>,
  okStatus: string,
  address: string,
) {
  return new Promise<KakaoAddressResult[]>((resolve) => {
    geocoder.addressSearch(address, (result, status) => {
      resolve(status === okStatus ? result : []);
    });
  });
}

export function KakaoAddressMapView({
  address,
  center,
  className,
  level = 4,
  markerTitle,
  title,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRef = useRef<KakaoMarkerInstance | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const normalizedAddress = address.trim();
    const centerLat = center?.lat ?? null;
    const centerLng = center?.lng ?? null;
    const hasCenter = typeof centerLat === 'number'
      && Number.isFinite(centerLat)
      && typeof centerLng === 'number'
      && Number.isFinite(centerLng);

    markerRef.current?.setMap(null);
    markerRef.current = null;
    mapRef.current = null;
    setErrorMessage(null);

    if (!normalizedAddress && !hasCenter) {
      setErrorMessage('주소 정보가 없습니다.');
      return () => {
        mounted = false;
      };
    }

    const mountMap = async () => {
      try {
        await loadKakaoMapSdk();
        if (!mounted || !mapContainerRef.current) {
          return;
        }

        const kakaoMaps = (window as KakaoWindow).kakao?.maps;
        if (!kakaoMaps) {
          setErrorMessage('카카오맵을 불러오지 못했습니다.');
          return;
        }
        if (hasCenter) {
          const position = new kakaoMaps.LatLng(centerLat, centerLng);
          const map = new kakaoMaps.Map(mapContainerRef.current, { center: position, level });
          const marker = new kakaoMaps.Marker({
            image: markerImage(kakaoMaps),
            map,
            position,
            title: markerTitle ?? normalizedAddress,
            zIndex: 10,
          });

          mapRef.current = map;
          markerRef.current = marker;
          requestAnimationFrame(() => {
            if (!mounted || !mapContainerRef.current) {
              return;
            }
            map.relayout?.();
            map.setCenter(position);
          });
          return;
        }

        const services = kakaoMaps?.services;
        if (!kakaoMaps || !services?.Geocoder || !services.Status) {
          setErrorMessage('카카오 주소 검색 서비스를 불러오지 못했습니다.');
          return;
        }

        const geocoder = new services.Geocoder();
        let result: KakaoAddressResult[] = [];
        for (const candidate of addressSearchCandidates(normalizedAddress)) {
          result = await searchAddress(geocoder, services.Status.OK, candidate);
          if (result.length > 0) {
            break;
          }
        }
        if (!mounted || !mapContainerRef.current) {
          return;
        }
        if (result.length === 0) {
          setErrorMessage('주소를 지도에서 찾지 못했습니다.');
          return;
        }

        const lat = Number(result[0].y);
        const lng = Number(result[0].x);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setErrorMessage('지도 좌표를 해석하지 못했습니다.');
          return;
        }

        const position = new kakaoMaps.LatLng(lat, lng);
        const map = new kakaoMaps.Map(mapContainerRef.current, { center: position, level });
        const marker = new kakaoMaps.Marker({
          image: markerImage(kakaoMaps),
          map,
          position,
          title: markerTitle ?? normalizedAddress,
          zIndex: 10,
        });

        mapRef.current = map;
        markerRef.current = marker;
        requestAnimationFrame(() => {
          if (!mounted || !mapContainerRef.current) {
            return;
          }
          map.relayout?.();
          map.setCenter(position);
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '카카오맵 초기화에 실패했습니다.');
      }
    };

    mountMap();

    return () => {
      mounted = false;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [address, center?.lat, center?.lng, level, markerTitle]);

  if (errorMessage) {
    return (
      <div aria-label={title} className={className} role="img">
        <div className="kakao-map__fallback">{errorMessage}</div>
      </div>
    );
  }

  return <div aria-label={title} className={className} ref={mapContainerRef} role="img" />;
}
