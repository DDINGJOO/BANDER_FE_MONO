import { act, render } from '@testing-library/react';
import { KakaoMapView, readBoundsPayload } from '../KakaoMapView';

jest.mock('../../../lib/kakaoMap', () => ({
  loadKakaoMapSdk: jest.fn(() => Promise.resolve()),
}));

type LatLngLiteral = { lat: number; lng: number };

type StubListener = { handler: () => void; type: string };

function makeLatLng({ lat, lng }: LatLngLiteral) {
  return { getLat: () => lat, getLng: () => lng };
}

function makeBounds(sw: LatLngLiteral, ne: LatLngLiteral) {
  return {
    getNorthEast: () => makeLatLng(ne),
    getSouthWest: () => makeLatLng(sw),
  };
}

describe('readBoundsPayload', () => {
  test('extracts sw/ne/center/level from the kakao map instance', () => {
    const map = {
      getBounds: () => makeBounds({ lat: 37.55, lng: 126.93 }, { lat: 37.58, lng: 126.97 }),
      getCenter: () => makeLatLng({ lat: 37.565, lng: 126.95 }),
      getLevel: () => 5,
      setCenter: () => undefined,
    };

    const payload = readBoundsPayload(map, 4);

    expect(payload).toEqual({
      centerLat: 37.565,
      centerLng: 126.95,
      level: 5,
      neLat: 37.58,
      neLng: 126.97,
      swLat: 37.55,
      swLng: 126.93,
    });
  });

  test('falls back to fallbackLevel when getLevel is missing', () => {
    const map = {
      getBounds: () => makeBounds({ lat: 1, lng: 2 }, { lat: 3, lng: 4 }),
      getCenter: () => makeLatLng({ lat: 2, lng: 3 }),
      setCenter: () => undefined,
    };

    const payload = readBoundsPayload(map, 9);

    expect(payload?.level).toBe(9);
  });

  test('returns null when getBounds is unavailable', () => {
    const map = {
      setCenter: () => undefined,
    };

    expect(readBoundsPayload(map, 4)).toBeNull();
  });
});

describe('KakaoMapView listener cleanup', () => {
  function installKakaoStub(): { listeners: StubListener[]; removed: StubListener[] } {
    const listeners: StubListener[] = [];
    const removed: StubListener[] = [];

    const map = {
      getBounds: () => makeBounds({ lat: 1, lng: 2 }, { lat: 3, lng: 4 }),
      getCenter: () => makeLatLng({ lat: 2, lng: 3 }),
      getLevel: () => 4,
      relayout: () => undefined,
      setCenter: () => undefined,
    };

    const win = window as unknown as { kakao?: unknown };
    win.kakao = {
      maps: {
        CustomOverlay: function CustomOverlay() {
          return { setMap: () => undefined };
        },
        event: {
          addListener: (_target: unknown, type: string, handler: () => void) => {
            listeners.push({ handler, type });
          },
          removeListener: (_target: unknown, type: string, handler: () => void) => {
            removed.push({ handler, type });
          },
        },
        LatLng: function LatLng() {
          return makeLatLng({ lat: 0, lng: 0 });
        },
        Map: function Map() {
          return map;
        },
        Marker: function Marker() {
          return { setMap: () => undefined };
        },
        MarkerImage: function MarkerImage() {
          return {};
        },
        Point: function Point(x: number, y: number) {
          return { x, y };
        },
        Size: function Size(w: number, h: number) {
          return { height: h, width: w };
        },
      },
    };

    return { listeners, removed };
  }

  afterEach(() => {
    const win = window as unknown as { kakao?: unknown };
    delete win.kakao;
  });

  test('removeListener is invoked for each registered viewport listener on unmount', async () => {
    const { listeners, removed } = installKakaoStub();

    let view: ReturnType<typeof render> | undefined;
    await act(async () => {
      view = render(
        <KakaoMapView
          center={{ lat: 37.5, lng: 127 }}
          onBoundsChange={() => undefined}
          onUserInteractionStart={() => undefined}
          title="test-map"
        />
      );
      // Flush the loadKakaoMapSdk microtask + setMapReady state update.
      await Promise.resolve();
      await Promise.resolve();
    });

    // bumpLayout 'idle' (mount effect) + viewport effect 의 idle/dragstart/zoom_start.
    const types = listeners.map((l) => l.type).sort();
    expect(types).toEqual(['dragstart', 'idle', 'idle', 'zoom_start']);

    await act(async () => {
      view?.unmount();
    });

    // mount effect 의 bumpLayout idle + viewport effect 의 idle/dragstart/zoom_start
    // 까지 등록된 모든 listener 가 1:1 로 cleanup 되어야 한다 (총 4개).
    const removedTypes = removed.map((l) => l.type).sort();
    expect(removedTypes).toEqual(['dragstart', 'idle', 'idle', 'zoom_start']);
    expect(removed).toHaveLength(listeners.length);
  });
});
