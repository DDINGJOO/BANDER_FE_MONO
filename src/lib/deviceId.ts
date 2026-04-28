/**
 * chat-v2 (BE PR-A + FE PR-B) 의 deviceId 운반 — REST/WS 통일.
 *
 * <p><b>정책</b>:
 * <ul>
 *   <li>localStorage 1차 캐시 — 페이지 로드 시 빠른 read.</li>
 *   <li><code>bander_device_id</code> Cookie 발행 — 브라우저가 모든
 *       <code>*.bander.co</code> REST/WS 요청에 자동 동봉.
 *       <code>ChatHandshakeInterceptor</code> 의 cookie source 를 hit.</li>
 *   <li>localStorage ↔ cookie 양방향 동기화 (다른 탭 / cookie 만료 후 복원).</li>
 *   <li><b>raw token 정책</b> (백엔드 pattern <code>^[A-Za-z0-9._-]{1,128}$</code>):
 *     <ul>
 *       <li>형식: <code>web-{uuid v4}</code> (hex + dash, 길이 40 = 안전).</li>
 *       <li>percent-encoding 금지 — 서버는 <code>Cookie.getValue()</code> 를
 *           디코딩하지 않음.</li>
 *     </ul>
 *   </li>
 *   <li>SSR 안전망: <code>window</code> 없으면 ephemeral.</li>
 *   <li>같은 브라우저(=같은 디바이스) 가 WS handshake / REST cursor /
 *       sync-hint 모든 호출에 동일 deviceId 를 보내야 백엔드의
 *       device binding / cursor monotonic advance 가 정확히 동작한다.</li>
 * </ul>
 *
 * <p><b>호출 시점</b>: <code>src/index.tsx</code> 에서 앱 mount 직후 한 번
 * {@link ensureDeviceId} 호출. 이후 모든 fetch / WS 가 자동 cookie 동봉.
 */

const STORAGE_KEY = 'bander_device_id';
const COOKIE_NAME = 'bander_device_id';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 2; // 2 years

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ').filter(Boolean);
  for (const c of cookies) {
    const eqIndex = c.indexOf('=');
    if (eqIndex < 0) continue;
    const k = c.slice(0, eqIndex);
    if (k === name) return c.slice(eqIndex + 1);
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  // 3-gateway subdomain 공유: production 은 Domain=.bander.co. 로컬 dev 는
  // hostname 이 localhost 라 Domain 생략 (브라우저가 자동으로 host-only cookie).
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  const domainPart = isLocalhost ? '' : '; Domain=.bander.co';
  // Secure 는 https 일 때만 — http 로 발행하면 브라우저가 reject 함.
  const securePart = window.location.protocol === 'https:' ? '; Secure' : '';
  // SameSite=Lax: cross-subdomain (user.bander.co ↔ partner.bander.co) 자동
  // 전송 + 외부 사이트 reference 차단.
  document.cookie =
    `${name}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${domainPart}${securePart}`;
}

/**
 * deviceId 결정 + localStorage/cookie 양방향 동기화.
 *
 * <p>우선순위: localStorage 캐시 > 기존 cookie > 신규 발행. 둘 중 하나만
 * 있으면 다른 쪽에도 그 값을 반영하여 source-of-truth 일관 유지.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    // SSR 안전망 — 클라이언트 호출에서만 사용되어야 한다.
    return `web-${generateUuid()}`;
  }

  let cachedLs: string | null = null;
  try {
    cachedLs = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    cachedLs = null;
  }
  const cookieValue = readCookie(COOKIE_NAME);

  let deviceId: string;
  if (cachedLs && cachedLs.trim().length > 0) {
    deviceId = cachedLs;
  } else if (cookieValue && cookieValue.trim().length > 0) {
    deviceId = cookieValue;
  } else {
    deviceId = `web-${generateUuid()}`;
  }

  if (cachedLs !== deviceId) {
    try {
      window.localStorage.setItem(STORAGE_KEY, deviceId);
    } catch {
      // localStorage 차단/시크릿 모드 — cookie 만으로 운반 가능.
    }
  }
  if (cookieValue !== deviceId) {
    writeCookie(COOKIE_NAME, deviceId);
  }

  return deviceId;
}

/**
 * 앱 entry (index.tsx) 에서 한 번 호출 — cookie 발행 + localStorage 캐시.
 * 이후 모든 REST/WS 호출은 브라우저가 자동으로 cookie 동봉.
 */
export function ensureDeviceId(): string {
  return getOrCreateDeviceId();
}
