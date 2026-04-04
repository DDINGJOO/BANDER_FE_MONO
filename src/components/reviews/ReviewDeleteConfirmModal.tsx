import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ReviewDeleteConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

/** Figma 6419:81789 — 내 리뷰 삭제 확인 (body 포털 · 로그아웃 모달과 동일 레이아웃 토큰) */
export function ReviewDeleteConfirmModal({
  onCancel,
  onConfirm,
  open,
}: ReviewDeleteConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="review-delete-modal">
      <button
        aria-label="닫기"
        className="review-delete-modal__backdrop"
        onClick={onCancel}
        type="button"
      />
      <div
        className="review-delete-modal__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="review-delete-modal-title"
        aria-describedby="review-delete-modal-desc"
      >
        <div className="review-delete-modal__body">
          <div className="review-delete-modal__text">
            <p className="review-delete-modal__title" id="review-delete-modal-title">
              내 리뷰 삭제
            </p>
            <div className="review-delete-modal__desc" id="review-delete-modal-desc">
              <p className="review-delete-modal__desc-line">작성하신 리뷰를 삭제하시겠어요?</p>
              <p className="review-delete-modal__desc-line">삭제 시, 복구할 수 없습니다.</p>
            </div>
          </div>
          <div className="review-delete-modal__actions">
            <button
              className="review-delete-modal__btn review-delete-modal__btn--secondary"
              onClick={onCancel}
              type="button"
            >
              취소
            </button>
            <button
              className="review-delete-modal__btn review-delete-modal__btn--primary"
              onClick={onConfirm}
              type="button"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
