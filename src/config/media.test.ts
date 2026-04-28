import {
  DEFAULT_PROFILE_IMAGE_URL,
  resolveChatImageUrl,
  resolveProfileImageUrl,
} from './media';

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

  it('prefers the denormalized profileImageUrl over ref-based reconstruction', () => {
    process.env.REACT_APP_CDN_BASE_URL = 'https://cdn.example.com';

    expect(
      resolveProfileImageUrl(
        '11111111-1111-1111-1111-111111111111',
        'https://cdn.example.com/originals/abc/avatar.png'
      )
    ).toBe('https://cdn.example.com/originals/abc/avatar.png');
  });

  it('falls back to ref-based reconstruction when profileImageUrl is null', () => {
    process.env.REACT_APP_CDN_BASE_URL = 'https://cdn.example.com';

    // Legacy row (URL not yet backfilled) — same behaviour as before.
    expect(resolveProfileImageUrl('profiles/legacy.png', null)).toBe(
      'https://cdn.example.com/profiles/legacy.png'
    );
    expect(resolveProfileImageUrl('profiles/legacy.png', undefined)).toBe(
      'https://cdn.example.com/profiles/legacy.png'
    );
  });

  it('treats blob/data URLs in profileImageUrl as already-resolved', () => {
    expect(
      resolveProfileImageUrl(null, 'blob:http://localhost/profile-preview')
    ).toBe('blob:http://localhost/profile-preview');
  });
});

describe('resolveChatImageUrl', () => {
  const originalCdnBaseUrl = process.env.REACT_APP_CDN_BASE_URL;

  afterEach(() => {
    if (originalCdnBaseUrl === undefined) {
      delete process.env.REACT_APP_CDN_BASE_URL;
    } else {
      process.env.REACT_APP_CDN_BASE_URL = originalCdnBaseUrl;
    }
  });

  it('prefers the denormalized imageUrl over ref-based reconstruction', () => {
    process.env.REACT_APP_CDN_BASE_URL = 'https://cdn.example.com';

    expect(
      resolveChatImageUrl(
        '11111111-1111-1111-1111-111111111111',
        'https://cdn.example.com/originals/abc/photo.jpg',
      ),
    ).toBe('https://cdn.example.com/originals/abc/photo.jpg');
  });

  it('falls back to ref-based reconstruction when imageUrl is null (legacy row)', () => {
    process.env.REACT_APP_CDN_BASE_URL = 'https://cdn.example.com';

    expect(resolveChatImageUrl('chat/legacy.jpg', null)).toBe(
      'https://cdn.example.com/chat/legacy.jpg',
    );
    expect(resolveChatImageUrl('chat/legacy.jpg', undefined)).toBe(
      'https://cdn.example.com/chat/legacy.jpg',
    );
  });

  it('returns null when neither url nor ref is set (TEXT/SYSTEM messages)', () => {
    expect(resolveChatImageUrl(null)).toBeNull();
    expect(resolveChatImageUrl('', null)).toBeNull();
    expect(resolveChatImageUrl('   ', null)).toBeNull();
  });

  it('treats blob/data URLs as already-resolved', () => {
    expect(resolveChatImageUrl(null, 'blob:http://localhost/preview')).toBe(
      'blob:http://localhost/preview',
    );
    expect(resolveChatImageUrl(null, 'data:image/png;base64,XYZ')).toBe(
      'data:image/png;base64,XYZ',
    );
  });

  it('keeps absolute http(s) imageUrl unchanged', () => {
    expect(
      resolveChatImageUrl('abc', 'https://other-cdn.test/foo/bar.png'),
    ).toBe('https://other-cdn.test/foo/bar.png');
  });

  it('falls back to ref when imageUrl is blank', () => {
    process.env.REACT_APP_CDN_BASE_URL = 'https://cdn.example.com';
    expect(resolveChatImageUrl('chat/abc.jpg', '   ')).toBe(
      'https://cdn.example.com/chat/abc.jpg',
    );
  });

  it('returns null for ref-only when CDN is not configured', () => {
    delete process.env.REACT_APP_CDN_BASE_URL;
    expect(resolveChatImageUrl('chat/abc.jpg', null)).toBeNull();
  });
});
