import { tryDevLoginBypass } from '../config/devLogin';
import { getJson, postJson } from './client';
import type {
  LoginResponse,
  PasswordResetVerifyResponse,
  SignupCompletionResponse,
  SignupNicknameAvailabilityResponse,
  SignupRegistrationResponse,
  SignupTermResponse,
  SignupVerificationVerifyResponse,
  VerificationIssueResponse,
} from '../types/authApi';

export type {
  LoginResponse,
  PasswordResetVerifyResponse,
  SignupCompletionResponse,
  SignupNicknameAvailabilityResponse,
  SignupRegistrationResponse,
  SignupTermResponse,
  SignupVerificationVerifyResponse,
  VerificationIssueResponse,
} from '../types/authApi';

export function requestSignupVerification(email: string) {
  return postJson<VerificationIssueResponse>('/api/v1/auth/signup/request', { email });
}

export function resendSignupVerification(email: string) {
  return postJson<VerificationIssueResponse>('/api/v1/auth/signup/resend', { email });
}

export function verifySignupCode(email: string, verificationCode: string) {
  return postJson<SignupVerificationVerifyResponse>('/api/v1/auth/signup/verify', {
    email,
    verificationCode,
  });
}

export function registerSignup(
  verifiedEmailToken: string,
  password: string,
  passwordConfirm: string
) {
  return postJson<SignupRegistrationResponse>('/api/v1/auth/signup/registration', {
    password,
    passwordConfirm,
    verifiedEmailToken,
  });
}

export function getSignupTerms() {
  return getJson<SignupTermResponse[]>('/api/v1/auth/signup/terms');
}

export function getNicknameAvailability(nickname: string) {
  const params = new URLSearchParams({ nickname });
  return getJson<SignupNicknameAvailabilityResponse>(
    `/api/v1/auth/signup/nickname/availability?${params.toString()}`
  );
}

export function completeSignup(
  signupCompletionToken: string,
  nickname: string,
  gender: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY',
  regionCode: string,
  profileImageRef: string,
  consents: Array<{ agreed: boolean; termCode: string; version: string }>
) {
  return postJson<SignupCompletionResponse>('/api/v1/auth/signup/completion', {
    consents,
    gender,
    nickname,
    profileImageRef,
    regionCode,
    signupCompletionToken,
  });
}

export function requestPasswordReset(email: string) {
  return postJson<VerificationIssueResponse>('/api/v1/auth/password/reset/request', { email });
}

export function resendPasswordReset(email: string) {
  return postJson<VerificationIssueResponse>('/api/v1/auth/password/reset/resend', { email });
}

export function verifyPasswordResetCode(email: string, verificationCode: string) {
  return postJson<PasswordResetVerifyResponse>('/api/v1/auth/password/reset/verify', {
    email,
    verificationCode,
  });
}

export function completePasswordReset(
  passwordResetToken: string,
  password: string,
  passwordConfirm: string
) {
  return postJson<{ userId: string }>('/api/v1/auth/password/reset/confirm', {
    password,
    passwordConfirm,
    passwordResetToken,
  });
}

export type ProfileImageUploadResponse = {
  profileImageRef: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
};

export function requestProfileImageUpload(
  signupCompletionToken: string,
  fileName: string,
  contentType: string,
  contentLength: number
) {
  return postJson<ProfileImageUploadResponse>('/api/v1/auth/signup/profile-image/upload', {
    signupCompletionToken,
    fileName,
    contentType,
    contentLength,
  });
}

export function login(email: string, password: string) {
  const bypass = tryDevLoginBypass(email, password);
  if (bypass) {
    return Promise.resolve(bypass);
  }

  return postJson<LoginResponse>('/api/v1/auth/login', {
    email,
    password,
  });
}
