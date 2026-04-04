import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

export type ChangePasswordModalProps = {
  onClose: () => void;
  /** 제출 성공 시 (데모: 검증 통과 후 호출) */
  onSubmitSuccess?: () => void;
  open: boolean;
};

const PLACEHOLDERS = {
  current: '이전 비밀번호를 입력해주세요.',
  next: '새 비밀번호를 입력해주세요.',
  confirm: '새 비밀번호를 재입력해주세요.',
} as const;

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

/**
 * Figma 6419:86476 — 빈 필드·비활성 변경완료(#C4C9D4)
 * Figma 6419:86572 — 입력 후 활성 변경완료(#F6D155)
 */
export function ChangePasswordModal({
  onClose,
  onSubmitSuccess,
  open,
}: ChangePasswordModalProps) {
  const titleId = useId();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!open) return;
    setCurrent('');
    setNext('');
    setConfirm('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const canSubmit =
    current.trim().length > 0 &&
    next.trim().length > 0 &&
    confirm === next &&
    next.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmitSuccess?.();
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="change-pw-modal">
      <button
        aria-label="닫기"
        className="change-pw-modal__backdrop"
        onClick={onClose}
        type="button"
      />
      <div
        className="change-pw-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="change-pw-modal__header">
          <h2 className="change-pw-modal__header-title" id={titleId}>
            비밀번호 변경
          </h2>
          <button
            type="button"
            className="change-pw-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <ModalCloseIcon />
          </button>
        </header>

        <div className="change-pw-modal__body">
          <h3 className="change-pw-modal__section-title">비밀번호 변경하기</h3>
          <div className="change-pw-modal__fields">
            <input
              type="password"
              name="change-pw-current"
              autoComplete="current-password"
              className="change-pw-modal__input"
              placeholder={PLACEHOLDERS.current}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <input
              type="password"
              name="change-pw-new"
              autoComplete="new-password"
              className="change-pw-modal__input"
              placeholder={PLACEHOLDERS.next}
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <input
              type="password"
              name="change-pw-confirm"
              autoComplete="new-password"
              className="change-pw-modal__input"
              placeholder={PLACEHOLDERS.confirm}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        <footer className="change-pw-modal__footer">
          <button
            type="button"
            className={`change-pw-modal__submit${canSubmit ? ' change-pw-modal__submit--active' : ''}`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            변경완료
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
