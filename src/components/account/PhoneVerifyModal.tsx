import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { ApiError } from '../../api/client';
import { sendPhoneCode, updatePhone, verifyPhoneCode } from '../../api/phone';

export type PhoneVerifyModalProps = {
  onClose: () => void;
  onVerified: (maskedPhone: string) => void;
  open: boolean;
};

function ModalCloseIcon() {
  return (
    <svg aria-hidden fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function maskPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length < 7) return '';
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export function PhoneVerifyModal({ onClose, onVerified, open }: PhoneVerifyModalProps) {
  const titleId = useId();
  const phoneInputId = useId();
  const codeInputId = useId();

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'idle' | 'sent' | 'submitting'>('idle');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setPhone('');
    setStep('idle');
    setCode('');
    setSending(false);
    setVerifying(false);
    setError('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  const phoneValid = phone.length >= 10 && phone.length <= 11;
  const codeValid = code.length === 6;

  const handleSendCode = async () => {
    if (!phoneValid || sending) return;
    setSending(true);
    setError('');
    try {
      await sendPhoneCode(phone);
      setStep('sent');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '인증번호 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!codeValid || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const result = await verifyPhoneCode(phone, code);
      if (!result.verified) {
        setError('인증번호가 올바르지 않습니다.');
        return;
      }
      await updatePhone(phone, result.verificationToken);
      onVerified(maskPhone(phone));
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '인증에 실패했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  const dialog = (
    <div className="phone-verify-modal" role="presentation" onClick={handleClose}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="phone-verify-modal__panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="phone-verify-modal__header">
          <h2 className="phone-verify-modal__title" id={titleId}>
            휴대폰 인증
          </h2>
          <button
            aria-label="닫기"
            className="phone-verify-modal__close"
            onClick={handleClose}
            type="button"
          >
            <ModalCloseIcon />
          </button>
        </header>

        <div className="phone-verify-modal__body">
          <label className="phone-verify-modal__label" htmlFor={phoneInputId}>
            휴대폰 번호
          </label>
          <div className="phone-verify-modal__row">
            <input
              autoComplete="tel"
              className="phone-verify-modal__input"
              id={phoneInputId}
              inputMode="numeric"
              maxLength={11}
              onChange={(event) => {
                setPhone(event.target.value.replace(/[^0-9]/g, ''));
                if (step !== 'idle') {
                  setStep('idle');
                  setCode('');
                  setError('');
                }
              }}
              placeholder="01012345678"
              value={phone}
            />
            <button
              className="phone-verify-modal__action"
              disabled={!phoneValid || sending}
              onClick={handleSendCode}
              type="button"
            >
              {sending ? '전송 중...' : step === 'sent' ? '재전송' : '인증받기'}
            </button>
          </div>

          {step === 'sent' ? (
            <>
              <label className="phone-verify-modal__label" htmlFor={codeInputId}>
                인증번호
              </label>
              <div className="phone-verify-modal__row">
                <input
                  autoComplete="one-time-code"
                  className="phone-verify-modal__input"
                  id={codeInputId}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6자리 인증번호"
                  value={code}
                />
                <button
                  className="phone-verify-modal__action phone-verify-modal__action--primary"
                  disabled={!codeValid || verifying}
                  onClick={handleVerify}
                  type="button"
                >
                  {verifying ? '확인 중...' : '확인'}
                </button>
              </div>
              <p className="phone-verify-modal__help">5분 이내로 인증번호(6자리)를 입력해주세요.</p>
            </>
          ) : null}

          {error ? (
            <p className="phone-verify-modal__error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="phone-verify-modal__footer">
          <button
            className="phone-verify-modal__btn phone-verify-modal__btn--secondary"
            onClick={handleClose}
            type="button"
          >
            취소
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
