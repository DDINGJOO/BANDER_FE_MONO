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

type KakaoLatLngBounds = {
  getSouthWest: () => KakaoLatLng;
  getNorthEast: () => KakaoLatLng;
};

type KakaoMapInstance = {
  getBounds?: () => KakaoLatLngBounds;
  getCenter?: () => KakaoLatLng;
  getLevel?: () => number;
  relayout?: () => void;
  setCenter: (latLng: KakaoLatLng) => void;
};

type KakaoMarkerInstance = {
  setMap: (map: KakaoMapInstance | null) => void;
};

type KakaoCustomOverlayInstance = {
  setMap: (map: KakaoMapInstance | null) => void;
};

type KakaoMarker = {
  label?: string;
  labelClassName?: string;
  lat: number;
  lng: number;
  pinStyle?: 'active' | 'default';
  title?: string;
};

export type KakaoMapBoundsPayload = {
  centerLat: number;
  centerLng: number;
  level: number;
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
};

type Props = {
  center: { lat: number; lng: number };
  className?: string;
  level?: number;
  /** 비우면 `public/map-pins/*.png` 브랜드 핀 사용 */
  markerImageActiveSrc?: string;
  markerImageSrc?: string;
  markers?: KakaoMarker[];
  /**
   * Kakao 'idle' 이벤트 — 지도가 이동/줌 후 정지하면 viewport 상태를 콜백.
   * 호출자가 debounce/throttle 책임을 진다 (KakaoMapView 는 throttle 하지 않음).
   */
  onBoundsChange?: (bounds: KakaoMapBoundsPayload) => void;
  onReady?: (map: KakaoMapInstance) => void;
  /**
   * 사용자가 직접 'dragstart' 또는 'zoom_start' 를 트리거한 시점 알림.
   * 프로그램이 호출한 setCenter (programmatic move) 와 사용자 조작을 구분하기 위해
   * `onBoundsChange` 콜백을 게이팅할 때 사용.
   */
  onUserInteractionStart?: () => void;
  title: string;
};

type KakaoEventHandle = unknown;

type KakaoSize = { height: number; width: number };

type KakaoPoint = { x: number; y: number };

type KakaoCustomOverlayOptions = {
  clickable?: boolean;
  content: HTMLElement | string;
  map?: KakaoMapInstance;
  position: KakaoLatLng;
  xAnchor?: number;
  yAnchor?: number;
  zIndex?: number;
};

type KakaoEventName = 'idle' | 'dragstart' | 'zoom_start';

type KakaoEventListenerHandle = {
  handler: () => void;
  type: KakaoEventName;
};

type KakaoMapsNs = {
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlayInstance;
  event?: {
    addListener: (
      target: KakaoMapInstance,
      type: KakaoEventName,
      handler: () => void
    ) => KakaoEventHandle | void;
    removeListener?: (
      target: KakaoMapInstance,
      type: KakaoEventName,
      handler: () => void
    ) => void;
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

function buildLabelContent(label: string, labelClassName?: string): HTMLDivElement {
  const root = document.createElement('div');
  root.className = labelClassName ? `kakao-map__marker-label ${labelClassName}` : 'kakao-map__marker-label';
  root.textContent = label;
  return root;
}

export function readBoundsPayload(
  map: KakaoMapInstance,
  fallbackLevel: number
): KakaoMapBoundsPayload | null {
  if (!map.getBounds || !map.getCenter) {
    return null;
  }
  const bounds = map.getBounds();
  const center = map.getCenter();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const level = map.getLevel ? map.getLevel() : fallbackLevel;
  return {
    centerLat: center.getLat(),
    centerLng: center.getLng(),
    level,
    neLat: ne.getLat(),
    neLng: ne.getLng(),
    swLat: sw.getLat(),
    swLng: sw.getLng(),
  };
}

export function KakaoMapView({
  center,
  className,
  level = 4,
  markerImageActiveSrc,
  markerImageSrc,
  markers = [],
  onBoundsChange,
  onReady,
  onUserInteractionStart,
  title,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoMarkerInstance[]>([]);
  const overlaysRef = useRef<KakaoCustomOverlayInstance[]>([]);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const onUserInteractionStartRef = useRef(onUserInteractionStart);
  const onReadyRef = useRef(onReady);
  // mount effect 가 center.lat/lng 에 의존하면 부모의 setCenter 호출마다 지도가 destroy + 재생성 →
  // 마커 깜빡임 + Kakao tile 재요청 → "viewport 자동 재검색" UX 와 정반대. 마운트 시점의 초기 center
  // 만 잡기 위해 ref 로 보관, 이후 center 변경은 별도 setCenter effect 가 처리한다.
  const initialCenterRef = useRef(center);
  const levelRef = useRef(level);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** 지도가 비동기로 생성돼서, 첫 페인트 시점에는 mapRef가 비어 마커 effect가 즉시 return 하던 버그 방지 */
  const [mapReady, setMapReady] = useState(false);

  // ref 를 최신 콜백으로 동기화 — 콜백 identity 변동이 effect 를 재실행시키지 않도록.
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    onUserInteractionStartRef.current = onUserInteractionStart;
  }, [onUserInteractionStart]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    let mounted = true;
    setMapReady(false);

    // mount effect 안에서 등록한 모든 kakao listener 들을 보관해, cleanup 에서 1:1 로 풀어준다.
    // remount (예: parent 의 reset key 변경) 시 listener 누적 방지.
    const mountListenerHandles: KakaoEventListenerHandle[] = [];
    let mountedMap: KakaoMapInstance | null = null;
    let mountedKakaoMaps: KakaoMapsNs | null = null;

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

        const initialCenter = initialCenterRef.current;
        const map = new kakaoMaps.Map(mapContainerRef.current, {
          center: new kakaoMaps.LatLng(initialCenter.lat, initialCenter.lng),
          level,
        });

        mapRef.current = map;
        mountedMap = map;
        mountedKakaoMaps = kakaoMaps;
        onReadyRef.current?.(map);

        const bumpLayout = () => {
          map.relayout?.();
        };
        requestAnimationFrame(bumpLayout);
        kakaoMaps.event?.addListener(map, 'idle', bumpLayout);
        mountListenerHandles.push({ handler: bumpLayout, type: 'idle' });

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
      // mount effect 가 등록한 listener 들 best-effort 해제. SDK 미지원/이미 destroy 된 경우 조용히 무시.
      if (mountedMap && mountedKakaoMaps) {
        for (const { handler, type } of mountListenerHandles) {
          try {
            mountedKakaoMaps.event?.removeListener?.(mountedMap, type, handler);
          } catch {
            /* SDK 미지원 또는 map already destroyed — best-effort */
          }
        }
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
    };
    // 의도적으로 [level] 만. center 변경은 setCenter effect (line 363 인근) 에서 처리하고,
    // onReady 는 onReadyRef 로 mirror 한다 — 호출자가 inline 화살표를 매 렌더 새로 만들어도
    // 지도가 destroy + 재생성되지 않도록.
  }, [level]);

  // viewport 이벤트 (idle / dragstart / zoom_start) 구독.
  // 콜백이 전달된 경우에만 listener 등록 — 의미 없는 콜백 방지.
  // 의존성은 콜백 identity 가 아니라 "콜백 존재 여부 (boolean)" 만 본다 — 호출자가 inline arrow 를
  // 매 렌더 새로 만들어도 listener churn 이 발생하지 않음. 실제 호출은 ref 를 통해 최신 콜백으로 위임.
  const wantBounds = Boolean(onBoundsChange);
  const wantInteraction = Boolean(onUserInteractionStart);

  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const map = mapRef.current;
    const globalWindow = window as KakaoWindow;
    const kakaoMaps = globalWindow.kakao?.maps;
    if (!map || !kakaoMaps?.event) {
      return;
    }

    const handleIdle = () => {
      const cb = onBoundsChangeRef.current;
      if (!cb) {
        return;
      }
      const payload = readBoundsPayload(map, levelRef.current);
      if (payload) {
        cb(payload);
      }
    };
    const handleDragStart = () => {
      onUserInteractionStartRef.current?.();
    };
    const handleZoomStart = () => {
      onUserInteractionStartRef.current?.();
    };

    // 등록한 핸들을 보관해 cleanup 에서 1:1 로 풀어준다.
    // 기존 mount effect 의 idle bumpLayout 핸들과는 독립 (서로 다른 handler 인스턴스).
    const listenerHandles: KakaoEventListenerHandle[] = [];
    if (wantBounds) {
      kakaoMaps.event.addListener(map, 'idle', handleIdle);
      listenerHandles.push({ handler: handleIdle, type: 'idle' });
    }
    if (wantInteraction) {
      kakaoMaps.event.addListener(map, 'dragstart', handleDragStart);
      listenerHandles.push({ handler: handleDragStart, type: 'dragstart' });
      kakaoMaps.event.addListener(map, 'zoom_start', handleZoomStart);
      listenerHandles.push({ handler: handleZoomStart, type: 'zoom_start' });
    }

    return () => {
      // best-effort: removeListener 가 SDK 에 없거나 map 이 이미 destroy 된 경우엔
      // 조용히 GC 에 위임. ref 콜백은 다음 tick 에 noop/새 값으로 갱신됨.
      for (const { handler, type } of listenerHandles) {
        try {
          kakaoMaps.event?.removeListener?.(map, type, handler);
        } catch {
          /* SDK 미지원 또는 map already destroyed — best-effort, GC 의존 */
        }
      }
    };
  }, [mapReady, wantBounds, wantInteraction]);

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
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));

    const nextOverlays: KakaoCustomOverlayInstance[] = [];
    markersRef.current = markers.map((marker) => {
      const variant = marker.pinStyle ?? 'default';
      const image = brandMarkerImage(kakaoMaps, variant, markerImageSrc, markerImageActiveSrc);
      const position = new kakaoMaps.LatLng(marker.lat, marker.lng);
      const instance = new kakaoMaps.Marker({
        image,
        map,
        position,
        ...(marker.title ? { title: marker.title } : {}),
        zIndex: 10,
      });

      if (marker.label) {
        const overlay = new kakaoMaps.CustomOverlay({
          clickable: false,
          content: buildLabelContent(marker.label, marker.labelClassName),
          map,
          position,
          // 라벨을 핀 상단 중앙에 배치: x 는 가운데, y 는 마커 핀 위로 띄움.
          xAnchor: 0.5,
          yAnchor: 1.6,
          zIndex: 11,
        });
        nextOverlays.push(overlay);
      }
      return instance;
    });
    overlaysRef.current = nextOverlays;

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
