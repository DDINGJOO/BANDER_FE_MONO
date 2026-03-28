import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VerificationIssueResponse } from '../api/auth';

export type VerificationStatus = 'idle' | 'requesting' | 'verifying' | 'verified' | 'failed';

type VerificationFlowOptions<T> = {
  initialEmail?: string;
  onVerified?: (result: T) => void;
  requestVerification: (email: string) => Promise<VerificationIssueResponse>;
  resendVerification: (email: string) => Promise<VerificationIssueResponse>;
  verifyCode: (email: string, verificationCode: string) => Promise<T>;
};

export function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function secondsUntil(expiresAt: number | null) {
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
}

export function useVerificationFlow<T>({
  initialEmail = '',
  onVerified,
  requestVerification,
  resendVerification,
  verifyCode,
}: VerificationFlowOptions<T>) {
  const [email, setEmailState] = useState(initialEmail);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationCode, setVerificationCode] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [verifiedResult, setVerifiedResult] = useState<T | null>(null);
  const verifyRequestSequence = useRef(0);
  const lastVerificationAttemptKey = useRef<string | null>(null);
  const onVerifiedRef = useRef(onVerified);
  const verificationStatusRef = useRef<VerificationStatus>('idle');

  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    verificationStatusRef.current = verificationStatus;
  }, [verificationStatus]);

  useEffect(() => {
    setEmailState(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (!verificationRequested || !verificationExpiresAt || verificationStatus === 'verified') {
      setRemainingSeconds(secondsUntil(verificationExpiresAt));
      return undefined;
    }

    setRemainingSeconds(secondsUntil(verificationExpiresAt));
    const timerId = window.setInterval(() => {
      setRemainingSeconds(secondsUntil(verificationExpiresAt));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [verificationExpiresAt, verificationRequested, verificationStatus]);

  useEffect(() => {
    if (!verificationRequested) {
      setVerificationStatus('idle');
      verificationStatusRef.current = 'idle';
      return undefined;
    }

    if (verificationCode.length !== 6) {
      if (verificationStatusRef.current !== 'requesting') {
        setVerificationStatus('idle');
        verificationStatusRef.current = 'idle';
      }
      lastVerificationAttemptKey.current = null;
      return undefined;
    }

    const attemptKey = `${email}:${verificationCode}`;
    if (lastVerificationAttemptKey.current === attemptKey) {
      return undefined;
    }
    lastVerificationAttemptKey.current = attemptKey;

    const currentSequence = ++verifyRequestSequence.current;
    setVerificationStatus('verifying');
    verificationStatusRef.current = 'verifying';
    let active = true;

    void (async () => {
      try {
        const result = await verifyCode(email, verificationCode);
        if (!active || verifyRequestSequence.current !== currentSequence) {
          return;
        }
        setVerifiedResult(result);
        setVerificationStatus('verified');
        verificationStatusRef.current = 'verified';
        setToastMessage('');
        onVerifiedRef.current?.(result);
      } catch (error) {
        if (!active || verifyRequestSequence.current !== currentSequence) {
          return;
        }
        setVerificationStatus('failed');
        verificationStatusRef.current = 'failed';
        setVerifiedResult(null);
        setToastMessage(
          error instanceof Error ? error.message : '인증번호를 확인해주세요.'
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [
    email,
    verificationCode,
    verificationRequested,
    verifyCode,
  ]);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const setEmail = useCallback((value: string) => {
    setEmailState(value);
    setVerificationRequested(false);
    setVerificationExpiresAt(null);
    setRemainingSeconds(0);
    setVerificationStatus('idle');
    verificationStatusRef.current = 'idle';
    setVerificationCode('');
    setVerifiedResult(null);
    setToastMessage('');
    lastVerificationAttemptKey.current = null;
  }, []);

  const handleVerificationRequest = useCallback(async () => {
    if (email.trim().length === 0) {
      setToastMessage('이메일을 입력해주세요.');
      return;
    }

    setVerificationStatus('requesting');
    verificationStatusRef.current = 'requesting';
    setToastMessage('');
    setVerifiedResult(null);

    try {
      const response = verificationRequested
        ? await resendVerification(email)
        : await requestVerification(email);

      setVerificationRequested(true);
      setVerificationExpiresAt(new Date(response.expiresAt).getTime());
      setRemainingSeconds(secondsUntil(new Date(response.expiresAt).getTime()));
      setVerificationCode('');
      setVerificationStatus('idle');
      verificationStatusRef.current = 'idle';
      lastVerificationAttemptKey.current = null;
    } catch (error) {
      setVerificationStatus('failed');
      verificationStatusRef.current = 'failed';
      setToastMessage(
        error instanceof Error ? error.message : '인증번호 요청에 실패했습니다.'
      );
    }
  }, [email, requestVerification, resendVerification, verificationRequested]);

  const handleVerificationCodeChange = useCallback((value: string) => {
    setVerifiedResult(null);
    if (verificationStatus === 'verified') {
      setVerificationStatus('idle');
      verificationStatusRef.current = 'idle';
    }
    const nextValue = value.replace(/\D/g, '').slice(0, 6);
    if (nextValue.length < 6) {
      lastVerificationAttemptKey.current = null;
    }
    setVerificationCode(nextValue);
    setToastMessage('');
  }, [verificationStatus]);

  return useMemo(
    () => ({
      email,
      handleVerificationCodeChange,
      handleVerificationRequest,
      remainingSeconds,
      setEmail,
      toastMessage,
      verificationCode,
      verificationRequested,
      verificationStatus,
      verifiedResult,
    }),
    [
      email,
      remainingSeconds,
      handleVerificationCodeChange,
      handleVerificationRequest,
      setEmail,
      toastMessage,
      verificationCode,
      verificationRequested,
      verificationStatus,
      verifiedResult,
    ]
  );
}
