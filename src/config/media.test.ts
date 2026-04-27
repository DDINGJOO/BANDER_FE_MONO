import { DEFAULT_PROFILE_IMAGE_URL, resolveProfileImageUrl } from './media';

describe('resolveProfileImageUrl', () => {
  const originalCdnBaseUrl = process.env.REACT_APP_CDN_BASE_URL;

  afterEach(() => {
    if (originalCdnBaseUrl === undefined) {
      delete process.env.REACT_APP_CDN_BASE_URL;
    } else {
      process.env.REACT_APP_CDN_BASE_URL = originalCdnBaseUrl;
    }
  });

  it('uses the bundled default image when there is no custom profile image', () => {
    expect(resolveProfileImageUrl(null)).toBe(DEFAULT_PROFILE_IMAGE_URL);
    expect(resolveProfileImageUrl('')).toBe(DEFAULT_PROFILE_IMAGE_URL);
    expect(resolveProfileImageUrl('profile/default-v1')).toBe(DEFAULT_PROFILE_IMAGE_URL);
  });

  it('keeps direct image URLs unchanged', () => {
    expect(resolveProfileImageUrl('https://cdn.example.com/profile.png')).toBe(
      'https://cdn.example.com/profile.png'
    );
    expect(resolveProfileImageUrl('blob:http://localhost/profile-preview')).toBe(
      'blob:http://localhost/profile-preview'
    );
  });

  it('resolves media refs through the configured CDN', () => {
    process.env.REACT_APP_CDN_BASE_URL = 'https://cdn.example.com';

    expect(resolveProfileImageUrl('profiles/user-1.png')).toBe(
      'https://cdn.example.com/profiles/user-1.png'
    );
  });
});
