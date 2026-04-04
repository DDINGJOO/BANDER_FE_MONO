import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type LogoutConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

/** Figma 6415:77802 — 로그아웃 확인 (헤더 `backdrop-filter` 때문에 fixed 기준점이 깨지지 않도록 body로 포털) */
export function LogoutConfirmModal({ onCancel, onConfirm, open }: LogoutConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="home-logout-modal">
      <button aria-label="닫기" className="home-logout-modal__backdrop" onClick={onCancel} type="button" />
      <div
        className="home-logout-modal__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="home-logout-modal-title"
        aria-describedby="home-logout-modal-desc"
      >
        <div className="home-logout-modal__body">
          <div className="home-logout-modal__text">
            <p className="home-logout-modal__title" id="home-logout-modal-title">
              로그아웃
            </p>
            <p className="home-logout-modal__desc" id="home-logout-modal-desc">
              정말 로그아웃하시겠어요?
            </p>
          </div>
          <div className="home-logout-modal__actions">
            <button className="home-logout-modal__btn home-logout-modal__btn--secondary" onClick={onCancel} type="button">
              취소
            </button>
            <button className="home-logout-modal__btn home-logout-modal__btn--primary" onClick={onConfirm} type="button">
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
