import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type CommunityReplyDeleteModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

/** Figma 6406:65324 — 댓글 삭제 확인 */
export function CommunityReplyDeleteModal({ onCancel, onConfirm, open }: CommunityReplyDeleteModalProps) {
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
    <div className="community-reply-del-modal">
      <button
        aria-label="닫기"
        className="community-reply-del-modal__backdrop"
        onClick={onCancel}
        type="button"
      />
      <div
        aria-describedby="community-reply-del-modal-desc"
        aria-labelledby="community-reply-del-modal-title"
        aria-modal="true"
        className="community-reply-del-modal__dialog"
        role="alertdialog"
      >
        <div className="community-reply-del-modal__body">
          <div className="community-reply-del-modal__text">
            <p className="community-reply-del-modal__title" id="community-reply-del-modal-title">
              댓글 삭제
            </p>
            <p className="community-reply-del-modal__desc" id="community-reply-del-modal-desc">
              해당 댓글을 삭제하시겠어요?
            </p>
          </div>
          <div className="community-reply-del-modal__actions">
            <button
              className="community-reply-del-modal__btn community-reply-del-modal__btn--secondary"
              onClick={onCancel}
              type="button"
            >
              취소
            </button>
            <button
              className="community-reply-del-modal__btn community-reply-del-modal__btn--primary"
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
