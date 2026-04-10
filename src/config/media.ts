import { getCdnBaseUrl } from './publicEnv';

/**
 * Convert a profileImageRef (S3 key) to a displayable URL.
 * Returns undefined for the default/placeholder ref so callers can render
 * a CSS fallback (gradient avatar) instead of a broken <img>.
 */
export function resolveProfileImageUrl(ref: string | null | undefined): string | undefined {
  if (!ref || ref === 'profile/default-v1') {
    return undefined;
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

  // No CDN configured — treat as not-resolvable
  return undefined;
}
