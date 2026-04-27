import { getCdnBaseUrl } from './publicEnv';

const publicBaseUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

export const DEFAULT_PROFILE_IMAGE_REF = 'profile/default-v1';
export const DEFAULT_PROFILE_IMAGE_URL = `${publicBaseUrl}/default-profile.svg`;

/**
 * Convert a profileImageRef (S3 key) to a displayable URL.
 * Falls back to the bundled default avatar whenever there is no custom image.
 */
export function resolveProfileImageUrl(ref: string | null | undefined): string {
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
