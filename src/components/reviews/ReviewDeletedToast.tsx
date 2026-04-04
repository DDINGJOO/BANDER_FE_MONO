import { createPortal } from 'react-dom';

/** Figma 6419:81799 — 리뷰 삭제 완료 토스트 */
export function ReviewDeletedToast({ open }: { open: boolean }) {
  if (!open) return null;

  return createPortal(
    <div
      className="review-deleted-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="review-deleted-toast__text">리뷰가 삭제되었습니다.</p>
    </div>,
    document.body,
  );
}
