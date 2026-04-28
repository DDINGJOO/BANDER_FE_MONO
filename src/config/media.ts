import { getCdnBaseUrl } from './publicEnv';

const publicBaseUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

export const DEFAULT_PROFILE_IMAGE_REF = 'profile/default-v1';
export const DEFAULT_PROFILE_IMAGE_URL = `${publicBaseUrl}/default-profile.svg`;

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

  // S3 key — prepend CDN base
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
  const cdn = getCdnBaseUrl();
  if (cdn) {
    return `${cdn}/${normalizedRef}`;
  }
  return null;
}
