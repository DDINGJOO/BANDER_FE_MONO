import {
  boundsCenterDistance,
  boundsDiagonal,
  bboxToParam,
  paramToBbox,
  type Bounds,
  type BoundsWithCenter,
} from '../mapBounds';

const sampleBounds: Bounds = {
  swLat: 37.5,
  swLng: 126.9,
  neLat: 37.6,
  neLng: 127.0,
};

function withCenter(b: Bounds, level = 5): BoundsWithCenter {
  return {
    ...b,
    centerLat: (b.swLat + b.neLat) / 2,
    centerLng: (b.swLng + b.neLng) / 2,
    level,
  };
}

describe('bboxToParam', () => {
  it('직렬화 형식: "swLat,swLng,neLat,neLng"', () => {
    expect(bboxToParam(sampleBounds)).toBe('37.5,126.9,37.6,127');
  });

  it('소수점 6자리로 trim', () => {
    const b: Bounds = {
      swLat: 37.123456789,
      swLng: 126.987654321,
      neLat: 37.234567891,
      neLng: 127.012345678,
    };
    const out = bboxToParam(b);
    out.split(',').forEach((part) => {
      const decimals = part.split('.')[1];
      if (decimals) {
        expect(decimals.length).toBeLessThanOrEqual(6);
      }
    });
  });
});

describe('paramToBbox', () => {
  it('정상 직렬화 문자열 라운드트립', () => {
    const param = bboxToParam(sampleBounds);
    const parsed = paramToBbox(param);
    expect(parsed).not.toBeNull();
    expect(parsed!.swLat).toBeCloseTo(sampleBounds.swLat, 5);
    expect(parsed!.swLng).toBeCloseTo(sampleBounds.swLng, 5);
    expect(parsed!.neLat).toBeCloseTo(sampleBounds.neLat, 5);
    expect(parsed!.neLng).toBeCloseTo(sampleBounds.neLng, 5);
  });

  it('null / undefined / 빈 문자열 -> null', () => {
    expect(paramToBbox(null)).toBeNull();
    expect(paramToBbox(undefined)).toBeNull();
    expect(paramToBbox('')).toBeNull();
  });

  it('파트 수가 4 가 아니면 null', () => {
    expect(paramToBbox('37.5,126.9,37.6')).toBeNull();
    expect(paramToBbox('37.5,126.9,37.6,127.0,extra')).toBeNull();
  });

  it('비숫자 파트 포함 -> null', () => {
    expect(paramToBbox('37.5,abc,37.6,127.0')).toBeNull();
    expect(paramToBbox('NaN,126.9,37.6,127.0')).toBeNull();
  });

  it('sw 가 ne 보다 크면 (역전) -> null', () => {
    expect(paramToBbox('37.7,126.9,37.6,127.0')).toBeNull();
    expect(paramToBbox('37.5,127.5,37.6,127.0')).toBeNull();
  });

  it('주변 공백 허용', () => {
    const parsed = paramToBbox(' 37.5 , 126.9 , 37.6 , 127.0 ');
    expect(parsed).not.toBeNull();
    expect(parsed!.neLng).toBeCloseTo(127.0, 5);
  });
});

describe('boundsDiagonal', () => {
  it('정사각형 viewport 의 대각선', () => {
    const b: Bounds = { swLat: 0, swLng: 0, neLat: 1, neLng: 1 };
    expect(boundsDiagonal(b)).toBeCloseTo(Math.SQRT2, 5);
  });

  it('영역 0 이면 0', () => {
    const b: Bounds = { swLat: 37.5, swLng: 126.9, neLat: 37.5, neLng: 126.9 };
    expect(boundsDiagonal(b)).toBe(0);
  });
});

describe('boundsCenterDistance', () => {
  it('동일 center 면 0', () => {
    const a = withCenter(sampleBounds);
    expect(boundsCenterDistance(a, a)).toBe(0);
  });

  it('center 가 다르면 양수', () => {
    const a = withCenter(sampleBounds);
    const moved: BoundsWithCenter = {
      ...a,
      centerLat: a.centerLat + 0.05,
      centerLng: a.centerLng + 0.05,
    };
    expect(boundsCenterDistance(a, moved)).toBeCloseTo(Math.sqrt(0.05 ** 2 + 0.05 ** 2), 5);
  });

  it('대칭', () => {
    const a = withCenter(sampleBounds);
    const b = withCenter({
      swLat: 37.4,
      swLng: 126.8,
      neLat: 37.5,
      neLng: 126.9,
    });
    expect(boundsCenterDistance(a, b)).toBeCloseTo(boundsCenterDistance(b, a), 10);
  });

  it('재검색 임계값 시나리오: 대각선 20% 이동 시 trigger', () => {
    const a = withCenter(sampleBounds);
    const diag = boundsDiagonal(sampleBounds);
    const threshold = diag * 0.2;
    const moved: BoundsWithCenter = {
      ...a,
      centerLat: a.centerLat + threshold * 1.1,
    };
    expect(boundsCenterDistance(a, moved)).toBeGreaterThan(threshold);
  });
});
