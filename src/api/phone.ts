import { postJson } from './client';

export type SendCodeResponse = {
  expiresInSeconds: number;
  resendAvailableAt: string;
};

export type VerifyCodeResponse = {
  verified: boolean;
  verificationToken: string;
};

export function sendPhoneCode(phoneNumber: string, purpose: string = 'CHANGE_PHONE') {
  return postJson<SendCodeResponse>('/api/v1/auth/phone/send-code', {
    phoneNumber,
    purpose,
  });
}

export function verifyPhoneCode(phoneNumber: string, code: string, purpose: string = 'CHANGE_PHONE') {
  return postJson<VerifyCodeResponse>('/api/v1/auth/phone/verify-code', {
    phoneNumber,
    code,
    purpose,
  });
}
