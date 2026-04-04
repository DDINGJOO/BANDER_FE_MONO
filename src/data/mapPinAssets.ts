/**
 * 카카오맵 MarkerImage용 로컬 PNG (`public/map-pins/`).
 * Figma `탐색_맵`(6406-73295) 안의 `location_pin` 인스턴스와 동일:
 * https://www.figma.com/design/EoBH3U1mU3oQBMTnpOO2r8/…?node-id=6406-73300
 * 원본 SVG: `public/map-pins/location-pin-figma.svg` → rsvg-convert -w 52 → default/active.png
 */
function mapPinPath(filename: 'active.png' | 'default.png'): string {
  const base = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
  return base ? `${base}/map-pins/${filename}` : `/map-pins/${filename}`;
}

export const MAP_MARKER_IMAGE_DEFAULT = mapPinPath('default.png');

export const MAP_MARKER_IMAGE_ACTIVE = mapPinPath('active.png');

/** 핀 캔버스(내보낸 PNG) 52×58 — 앵커는 핀 하단·그림자 근처 */
export const MAP_MARKER_LAYOUT = {
  anchorX: 24,
  anchorY: 46,
  height: 58,
  width: 52,
} as const;
