/** Auth API response shapes — shared by `api/auth` and future MSW/fixtures. */

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

export type SignupCompletionResponse = {
  status: string;
  userId: number;
};

export type PasswordResetVerifyResponse = {
  expiresAt: string;
  passwordResetToken: string;
};

export type LoginResponse = {
  expiresAt: string;
  gatewayContextToken: string;
  userId: number | string;
};
