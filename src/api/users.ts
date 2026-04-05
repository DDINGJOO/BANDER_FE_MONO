import { getJson, patchJson, postJson, requestVoid } from './client';

// --- Profile ---

export type UserProfile = {
  userId: number;
  nickname: string;
  bio: string | null;
  profileImageRef: string | null;
  gender: string | null;
  regionCode: string | null;
  genres: string | null;
  instruments: string | null;
  createdAt: string;
};

export type UpdateProfileRequest = {
  nickname: string;
  bio?: string;
  profileImageRef?: string;
  gender?: string;
  regionCode?: string;
  genres?: string;
  instruments?: string;
};

export type UpdateProfileResponse = {
  userId: number;
  nickname: string;
  bio: string | null;
  profileImageRef: string | null;
  gender: string | null;
  regionCode: string | null;
  genres: string | null;
  instruments: string | null;
};

export function getMyProfile() {
  return getJson<UserProfile>('/api/v1/users/me/profile');
}

export function updateMyProfile(req: UpdateProfileRequest) {
  return patchJson<UpdateProfileResponse>('/api/v1/users/me/profile', req);
}

// --- Account ---

export type AccountInfo = {
  userId: number;
  email: string;
  status: string;
  createdAt: string;
  nickname: string;
  profileImageRef: string | null;
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
