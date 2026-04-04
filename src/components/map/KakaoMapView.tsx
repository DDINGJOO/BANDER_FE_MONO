import React, { useEffect, useRef, useState } from 'react';
import {
  MAP_MARKER_IMAGE_ACTIVE,
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

type KakaoMarker = {
  lat: number;
  lng: number;
  pinStyle?: 'active' | 'default';
  title?: string;
};

type Props = {
  center: { lat: number; lng: number };
  className?: string;
  level?: number;
  /** 비우면 `public/map-pins/*.png` 브랜드 핀 사용 */
  markerImageActiveSrc?: string;
  markerImageSrc?: string;
  markers?: KakaoMarker[];
  onReady?: (map: KakaoMapInstance) => void;
  title: string;
};

type KakaoSize = { height: number; width: number };

type KakaoPoint = { x: number; y: number };

type KakaoMapsNs = {
  event?: {
    addListener: (target: KakaoMapInstance, type: string, handler: () => void) => void;
  };
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
};

type KakaoMarkerImage = unknown;

type KakaoWindow = Window & {
  kakao?: {
    maps: KakaoMapsNs;
  };
};

function brandMarkerImage(
  maps: KakaoMapsNs,
  variant: 'active' | 'default',
  customDefaultSrc?: string,
  customActiveSrc?: string
): KakaoMarkerImage {
  const src =
    variant === 'active'
      ? customActiveSrc ?? MAP_MARKER_IMAGE_ACTIVE
      : customDefaultSrc ?? MAP_MARKER_IMAGE_DEFAULT;
  return new maps.MarkerImage(src, new maps.Size(MAP_MARKER_LAYOUT.width, MAP_MARKER_LAYOUT.height), {
    offset: new maps.Point(MAP_MARKER_LAYOUT.anchorX, MAP_MARKER_LAYOUT.anchorY),
  });
}

export function KakaoMapView({
  center,
  className,
  level = 4,
  markerImageActiveSrc,
  markerImageSrc,
  markers = [],
  onReady,
  title,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoMarkerInstance[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** 지도가 비동기로 생성돼서, 첫 페인트 시점에는 mapRef가 비어 마커 effect가 즉시 return 하던 버그 방지 */
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    setMapReady(false);

    const mountMap = async () => {
      try {
        await loadKakaoMapSdk();
        if (!mounted || !mapContainerRef.current) {
          return;
        }

        const globalWindow = window as KakaoWindow;
        const kakaoMaps = globalWindow.kakao?.maps;
        if (!kakaoMaps) {
          setErrorMessage('카카오맵 SDK를 찾을 수 없습니다.');
          return;
        }

        const map = new kakaoMaps.Map(mapContainerRef.current, {
          center: new kakaoMaps.LatLng(center.lat, center.lng),
          level,
        });

        mapRef.current = map;
        onReady?.(map);

        const bumpLayout = () => {
          map.relayout?.();
        };
        requestAnimationFrame(bumpLayout);
        kakaoMaps.event?.addListener(map, 'idle', bumpLayout);

        if (mounted) {
          setMapReady(true);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '카카오맵 초기화에 실패했습니다.');
      }
    };

    mountMap();

    return () => {
      mounted = false;
      setMapReady(false);
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, [center.lat, center.lng, level, onReady]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapRef.current;
    const globalWindow = window as KakaoWindow;
    const kakaoMaps = globalWindow.kakao?.maps;
    if (!map || !kakaoMaps) {
      return;
    }

    map.setCenter(new kakaoMaps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng, mapReady]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapRef.current;
    const globalWindow = window as KakaoWindow;
    const kakaoMaps = globalWindow.kakao?.maps;
    if (!map || !kakaoMaps) {
      return;
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = markers.map((marker) => {
      const variant = marker.pinStyle ?? 'default';
      const image = brandMarkerImage(kakaoMaps, variant, markerImageSrc, markerImageActiveSrc);
      return new kakaoMaps.Marker({
        image,
        map,
        position: new kakaoMaps.LatLng(marker.lat, marker.lng),
        ...(marker.title ? { title: marker.title } : {}),
        zIndex: 10,
      });
    });
    requestAnimationFrame(() => {
      map.relayout?.();
    });
  }, [mapReady, markerImageActiveSrc, markerImageSrc, markers]);

  if (errorMessage) {
    return (
      <div aria-label={title} className={className} role="img">
        <div className="kakao-map__fallback">{errorMessage}</div>
      </div>
    );
  }

  return <div aria-label={title} className={className} ref={mapContainerRef} role="img" />;
}
