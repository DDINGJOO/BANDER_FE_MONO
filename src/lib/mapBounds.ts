/**
 * 지도 viewport (bbox) 직렬화 + 변동 임계값 헬퍼.
 *
 * - 좌표는 WGS84 위경도 (degrees) 기준.
 * - 거리 계산은 한국 한정이라 가정하고 단순 Euclidean (위도 1도 ≈ 경도 1도 가중).
 *   정확한 거리 (km) 가 필요할 때는 호출부에서 haversine 으로 변환할 것.
 * - `bboxToParam` / `paramToBbox` 는 라운드트립 가능하지만, 부동소수 정밀도 때문에
 *   완전히 동일한 값은 보장되지 않는다 (URL 정밀도 6-7자리).
 */

export type Bounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

export type BoundsWithCenter = Bounds & {
  centerLat: number;
  centerLng: number;
  level: number;
};

const COORD_PRECISION = 6;

function isFiniteCoord(value: number): boolean {
  return Number.isFinite(value);
}

function isValidBounds(b: Bounds): boolean {
  return (
    isFiniteCoord(b.swLat) &&
    isFiniteCoord(b.swLng) &&
    isFiniteCoord(b.neLat) &&
    isFiniteCoord(b.neLng) &&
    b.neLat >= b.swLat &&
    b.neLng >= b.swLng
  );
}

/**
 * Bounds 를 backend 가 요구하는 `"swLat,swLng,neLat,neLng"` 문자열로 직렬화.
 * 정밀도 6자리 (≈ 11cm) 로 trim — URL 길이 절약 + 부동소수 해시 안정화.
 */
export function bboxToParam(b: Bounds): string {
  return [b.swLat, b.swLng, b.neLat, b.neLng]
    .map((v) => Number(v.toFixed(COORD_PRECISION)).toString())
    .join(',');
}

/**
 * `"swLat,swLng,neLat,neLng"` 문자열을 Bounds 로 파싱.
 * 형식 오류 / 비정상 좌표 / sw/ne 역전이면 null.
 * URL 입력은 신뢰할 수 없으므로 fail-soft.
 */
export function paramToBbox(s: string | null | undefined): Bounds | null {
  if (!s) return null;
  const parts = s.split(',');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => {
    const trimmed = p.trim();
    return trimmed === '' ? NaN : Number(trimmed);
  });
  if (nums.some((n) => !Number.isFinite(n))) return null;
  const [swLat, swLng, neLat, neLng] = nums;
  const bounds: Bounds = { swLat, swLng, neLat, neLng };
  return isValidBounds(bounds) ? bounds : null;
}

/**
 * 두 viewport center 간 단순 Euclidean 거리 (degrees).
 * 한국 위도 (≈ 37도) 에서 1도 ≈ 111km, 경도 1도 ≈ 88km 이지만 임계값 비교용이므로
 * 비등방성은 무시. 정확한 km 가 필요하면 호출부에서 haversine 사용.
 */
export function boundsCenterDistance(
  a: BoundsWithCenter,
  b: BoundsWithCenter,
): number {
  const dLat = a.centerLat - b.centerLat;
  const dLng = a.centerLng - b.centerLng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Bounds 의 대각선 길이 (degrees).
 * 임계값 비교의 기준치 — "viewport 의 X% 만큼 이동하면 재검색" 의 X% 분모.
 */
export function boundsDiagonal(b: Bounds): number {
  const dLat = b.neLat - b.swLat;
  const dLng = b.neLng - b.swLng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}
