import { getJson, patchJson, postJson, requestVoid } from './client';

// --- Profile ---

export type UserProfile = {
  userId: string;
  nickname: string;
  bio: string | null;
  profileImageRef: string | null;
  /** Denormalized CDN URL — preferred over rebuilding from profileImageRef. */
  profileImageUrl: string | null;
  gender: string | null;
  regionCode: string | null;
  genres: string | null;
  instruments: string | null;
  createdAt: string;
};

export type PublicUserProfile = Pick<
  UserProfile,
  | 'bio'
  | 'createdAt'
  | 'genres'
  | 'instruments'
  | 'nickname'
  | 'profileImageRef'
  | 'profileImageUrl'
  | 'userId'
>;

export type UpdateProfileRequest = {
  nickname: string;
  bio?: string;
  profileImageRef?: string;
  /**
   * Denormalized CDN URL captured from the profile-image grant response.
   * SHOULD be sent whenever profileImageRef is sent so reads avoid a
   * per-render round-trip to media-service.
   */
  profileImageUrl?: string;
  /** Required when profileImageRef changes (PR-H partial): JWS from grant API. */
  ownershipTicket?: string;
  gender?: string;
  regionCode?: string;
  genres?: string;
  instruments?: string;
};

export type UpdateProfileResponse = {
  userId: string;
  nickname: string;
  bio: string | null;
  profileImageRef: string | null;
  profileImageUrl: string | null;
  gender: string | null;
  regionCode: string | null;
  genres: string | null;
  instruments: string | null;
};

export function getMyProfile() {
  return getJson<UserProfile>('/api/v1/users/me/profile');
}

export function getPublicUserProfile(userId: string) {
  return getJson<PublicUserProfile>(
    `/api/v1/users/${encodeURIComponent(userId)}/profile`,
    { preserveAuthOnUnauthorized: true },
  );
}

export type UserMeSummary = {
  displayName: string;
  email: string;
  profileImageRef: string | null;
  /** Denormalized CDN URL — preferred over rebuilding from profileImageRef. */
  profileImageUrl: string | null;
  pointsLabel: string;
  couponCountLabel: string;
  reservationBadgeCount: number;
};

export function getMySummary() {
  return getJson<UserMeSummary>('/api/v1/users/me/summary', {
    preserveAuthOnUnauthorized: true,
  });
}

export function updateMyProfile(req: UpdateProfileRequest) {
  return patchJson<UpdateProfileResponse>('/api/v1/users/me/profile', req);
}

// --- Account ---

export type AccountInfo = {
  userId: string;
  email: string;
  status: string;
  createdAt: string;
  nickname: string;
  profileImageRef: string | null;
  phoneMasked: string | null;
  phoneVerified: boolean;
};

export function getMyAccount() {
  return getJson<AccountInfo>('/api/v1/users/me/account');
}

// --- Password ---

export function changePassword(currentPassword: string, newPassword: string) {
  return requestVoid('/api/v1/users/me/password', {
    body: JSON.stringify({ currentPassword, newPassword }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

// --- Deactivate ---

export function deactivateAccount(password?: string) {
  return requestVoid('/api/v1/users/me/deactivate', {
    body: password ? JSON.stringify({ password }) : undefined,
    method: 'POST',
  });
}

// --- Logout ---

export function logout() {
  return requestVoid('/api/v1/auth/logout', {
    method: 'POST',
  });
}

// --- Nickname ---

export type NicknameAvailability = {
  available: boolean;
};

export function checkNicknameAvailability(nickname: string) {
  const params = new URLSearchParams({ nickname });
  return getJson<NicknameAvailability>(
    `/api/v1/auth/signup/nickname/availability?${params.toString()}`
  );
}

// --- Profile Image Upload ---

export type ProfileImageUploadResponse = {
  profileImageRef: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
  /** JWS ownership ticket — required by PATCH /users/me/profile under PR-H partial. */
  ownershipTicket?: string;
  uploadHeaders?: Record<string, string>;
};

export function requestProfileImageUploadForEdit(
  fileName: string,
  contentType: string,
  contentLength: number,
) {
  return postJson<ProfileImageUploadResponse>('/api/v1/users/me/profile-image/upload', {
    fileName,
    contentType,
    contentLength,
  });
}
