import { getCdnBaseUrl } from './publicEnv';

const publicBaseUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

export const DEFAULT_PROFILE_IMAGE_REF = 'profile/default-v1';
export const DEFAULT_PROFILE_IMAGE_URL = `${publicBaseUrl}/default-profile.svg`;

/**
 * Detect a mediaId-shaped (UUID v4) ref produced by the new media pipeline
 * (post-PR-#348 era). For these refs the canonical S3 key is
 * `originals/{mediaId}/{filename}` — but the filename is not encoded in
 * the ref alone, so building `<CDN>/<ref>` produces a guaranteed S3 403
 * (ORB-blocked image). Callers should fall back to a default image
 * whenever the denormalized URL is missing for a UUID-shaped ref.
 */
const UUID_REF_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isMediaIdRef(ref: string): boolean {
  return UUID_REF_PATTERN.test(ref);
}

/**
 * Convert a profileImageRef (S3 key) to a displayable URL.
 *
 * Prefers the server-supplied `profileImageUrl` (denormalized CDN URL,
 * available from V16 onwards) when present — this skips the lossy
 * ref → URL reconstruction entirely. The S3 key for new uploads is
 * `originals/{mediaId}/{filename}`, but the frontend only has `mediaId`,
 * so direct CDN composition does not work for those rows. Legacy rows
 * (no URL persisted) still fall through to the historical CDN-prefix
 * path so existing behaviour is preserved.
 *
 * Falls back to the bundled default avatar whenever there is no custom image.
 */
export function resolveProfileImageUrl(
  ref: string | null | undefined,
  url?: string | null,
): string {
  const normalizedUrl = url?.trim();
  if (normalizedUrl) {
    if (
      normalizedUrl.startsWith('http') ||
      normalizedUrl.startsWith('blob:') ||
      normalizedUrl.startsWith('data:')
    ) {
      return normalizedUrl;
    }
    // Server returned a relative path — prepend CDN if configured.
    const cdn = getCdnBaseUrl();
    if (cdn) {
      return `${cdn}/${normalizedUrl.replace(/^\//, '')}`;
    }
    // Otherwise drop through to ref-based resolution for safety.
  }

  const normalizedRef = ref?.trim();

  if (!normalizedRef || normalizedRef === DEFAULT_PROFILE_IMAGE_REF) {
    return DEFAULT_PROFILE_IMAGE_URL;
  }

  // Already a full URL (blob: or https:)
  if (
    normalizedRef.startsWith('http') ||
    normalizedRef.startsWith('blob:') ||
    normalizedRef.startsWith('data:')
  ) {
    return normalizedRef;
  }

  // New-style mediaId UUID ref with no denormalized URL: the filename is
  // unrecoverable from the ref alone, so `<CDN>/<ref>` would 403 from S3.
  // Show the default avatar until the denormalized URL gets backfilled.
  if (isMediaIdRef(normalizedRef)) {
    return DEFAULT_PROFILE_IMAGE_URL;
  }

  // Legacy path-style S3 key (e.g. `profiles/user-1.png`) — prepend CDN base.
  const cdn = getCdnBaseUrl();
  if (cdn) {
    return `${cdn}/${normalizedRef}`;
  }

  // No CDN configured — show a stable default instead of a broken image.
  return DEFAULT_PROFILE_IMAGE_URL;
}

/**
 * R1-J: resolve a chat IMAGE message attachment to a displayable URL.
 *
 * Prefers the server-supplied `imageUrl` (denormalized CDN URL, available
 * from chat-service V6 onwards) when present. Legacy IMAGE rows persisted
 * before V6 carry NULL there, so we fall back to the historical CDN-prefix
 * reconstruction from `content` (mediaRef) — best-effort, acceptable for
 * legacy rows because the read path is otherwise broken on those.
 *
 * Returns `null` for messages with no image (TEXT/SYSTEM) so callers can
 * branch on the result.
 */
export function resolveChatImageUrl(
  ref: string | null | undefined,
  url?: string | null,
): string | null {
  const normalizedUrl = url?.trim();
  if (normalizedUrl) {
    if (
      normalizedUrl.startsWith('http') ||
      normalizedUrl.startsWith('blob:') ||
      normalizedUrl.startsWith('data:')
    ) {
      return normalizedUrl;
    }
    const cdn = getCdnBaseUrl();
    if (cdn) {
      return `${cdn}/${normalizedUrl.replace(/^\//, '')}`;
    }
  }

  const normalizedRef = ref?.trim();
  if (!normalizedRef) {
    return null;
  }
  if (
    normalizedRef.startsWith('http') ||
    normalizedRef.startsWith('blob:') ||
    normalizedRef.startsWith('data:')
  ) {
    return normalizedRef;
  }
  // New-style mediaId UUID ref with no denormalized URL: filename is
  // unrecoverable, `<CDN>/<ref>` would 403 from S3. Treat as no image.
  if (isMediaIdRef(normalizedRef)) {
    return null;
  }
  const cdn = getCdnBaseUrl();
  if (cdn) {
    return `${cdn}/${normalizedRef}`;
  }
  return null;
}
