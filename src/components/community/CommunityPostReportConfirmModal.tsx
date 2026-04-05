import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type CommunityPostReportConfirmModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

/** Figma 6406:65672 — 게시글 신고 확인 (Pop Up 8) */
export function CommunityPostReportConfirmModal({
  onCancel,
  onConfirm,
  open,
}: CommunityPostReportConfirmModalProps) {
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
    <div className="community-post-report-confirm-modal">
      <button
        aria-label="닫기"
        className="community-post-report-confirm-modal__backdrop"
        onClick={onCancel}
        type="button"
      />
      <div
        aria-describedby="community-post-report-confirm-modal-desc"
        aria-labelledby="community-post-report-confirm-modal-title"
        aria-modal="true"
        className="community-post-report-confirm-modal__dialog"
        role="alertdialog"
      >
        <div className="community-post-report-confirm-modal__body">
          <div className="community-post-report-confirm-modal__text">
            <p className="community-post-report-confirm-modal__title" id="community-post-report-confirm-modal-title">
              게시글 신고
            </p>
            <p className="community-post-report-confirm-modal__desc" id="community-post-report-confirm-modal-desc">
              선택하신 게시글을 신고하시겠어요?
            </p>
          </div>
          <div className="community-post-report-confirm-modal__actions">
            <button
              className="community-post-report-confirm-modal__btn community-post-report-confirm-modal__btn--secondary"
              onClick={onCancel}
              type="button"
            >
              취소
            </button>
            <button
              className="community-post-report-confirm-modal__btn community-post-report-confirm-modal__btn--primary"
              onClick={onConfirm}
              type="button"
            >
              신고
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
