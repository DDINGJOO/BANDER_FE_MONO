import { getCdnBaseUrl } from './publicEnv';

const DEFAULT_PROFILE_IMAGE = '/images/default-profile.png';

/**
 * Convert a profileImageRef (S3 key) to a displayable URL.
 * If CDN is configured, prepend the CDN base URL.
 * Handles: full URLs (https://), blob: URLs, S3 keys, and defaults.
 */
export function resolveProfileImageUrl(ref: string | null | undefined): string {
  if (!ref || ref === 'profile/default-v1') {
    return DEFAULT_PROFILE_IMAGE;
  }

  // Already a full URL (blob: or https:)
  if (ref.startsWith('http') || ref.startsWith('blob:')) {
    return ref;
  }

  // S3 key — prepend CDN base
  const cdn = getCdnBaseUrl();
  if (cdn) {
    return `${cdn}/${ref}`;
  }

  // No CDN configured — return key as-is
  return ref;
}
