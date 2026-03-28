import { getJson, postJson } from './client';

export type VerificationIssueResponse = {
  dispatchType: 'CREATED' | 'RESENT_EXISTING' | 'ROTATED';
  expiresAt: string;
  resendAvailableAt: string;
};

export type SignupVerificationVerifyResponse = {
  expiresAt: string;
  verifiedEmailToken: string;
};

export type SignupRegistrationResponse = {
  expiresAt: string;
  signupCompletionToken: string;
  status: string;
  userId: number;
};

export type SignupTermResponse = {
  contentUrl: string;
  effectiveAt: string;
  required: boolean;
  termCode: string;
  title: string;
  version: string;
};

export type SignupNicknameAvailabilityResponse = {
  available: boolean;
};

export type PasswordResetVerifyResponse = {
  expiresAt: string;
  passwordResetToken: string;
};

export type LoginResponse = {
  expiresAt: string;
  gatewayContextToken: string;
  userId: number;
};

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
  return postJson<{ status: string; userId: number }>('/api/v1/auth/signup/completion', {
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
  return postJson<{ userId: number }>('/api/v1/auth/password/reset/confirm', {
    password,
    passwordConfirm,
    passwordResetToken,
  });
}

export function login(email: string, password: string) {
  return postJson<LoginResponse>('/api/v1/auth/login', {
    email,
    password,
  });
}
