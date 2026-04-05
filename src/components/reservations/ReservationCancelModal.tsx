import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ReservationCancelNoticeRow = {
  label: string;
  value: string;
  /** 최종 환불금액 행 — 라벨/값 Body 1 15M 검정, 값 SemiBold */
  emphasis?: boolean;
};

export type ReservationCancelModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Figma 6419:80593 — 2줄 리드 */
  leadLines: [string, string];
  /** Figma 6419:80627 */
  alertText: string;
  /** Figma 6419:80544 */
  noticeTitle?: string;
  noticeRows: ReservationCancelNoticeRow[];
  /** 구분선: 이 0-based 인덱스 다음에 삽입 (Figma: 1행 뒤) */
  dividerAfterRowIndex?: number;
  confirmLabel?: string;
};

function CloseGlyph20() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function ErrorGlyph14() {
  return (
    <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 14 14" width="14">
      <path
        d="M7 1.75a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5Z"
        fill="none"
        stroke="#ff3a3d"
        strokeWidth="1.2"
      />
      <path d="M7 4.2V7.4M7 9.45h.01" stroke="#ff3a3d" strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  );
}

/** Figma 6419:80535 예약취소 */
export function ReservationCancelModal({
  open,
  onClose,
  onConfirm,
  leadLines,
  alertText,
  noticeTitle = '환불 예정 정보',
  noticeRows,
  dividerAfterRowIndex,
  confirmLabel = '예약 취소',
}: ReservationCancelModalProps) {
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

  if (!open) return null;

  return createPortal(
    <div className="res-cancel-modal">
      <button aria-label="닫기" className="res-cancel-modal__backdrop" onClick={onClose} type="button" />
      <div
        className="res-cancel-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="res-cancel-modal-title"
      >
        <header className="res-cancel-modal__header">
          <h2 className="res-cancel-modal__title" id="res-cancel-modal-title">
            예약취소
          </h2>
          <button className="res-cancel-modal__close" onClick={onClose} type="button" aria-label="닫기">
            <CloseGlyph20 />
          </button>
        </header>

        <div className="res-cancel-modal__body-white">
          <div className="res-cancel-modal__alert">
            <span className="res-cancel-modal__alert-icon" aria-hidden>
              <ErrorGlyph14 />
            </span>
            <p className="res-cancel-modal__alert-text">{alertText}</p>
          </div>

          <div className="res-cancel-modal__lead">
            <p className="res-cancel-modal__lead-line">{leadLines[0]}</p>
            <p className="res-cancel-modal__lead-line">{leadLines[1]}</p>
          </div>
        </div>

        <div className="res-cancel-modal__body-gray">
          <h3 className="res-cancel-modal__notice-title">{noticeTitle}</h3>
          <div className="res-cancel-modal__notice-rows">
            {noticeRows.map((row, i) => (
              <div key={`${row.label}-${i}`}>
                {dividerAfterRowIndex != null && i === dividerAfterRowIndex + 1 ? (
                  <hr className="res-cancel-modal__notice-rule" />
                ) : null}
                <div
                  className={`res-cancel-modal__notice-row${row.emphasis ? ' res-cancel-modal__notice-row--emphasis' : ''}`}
                >
                  <span className="res-cancel-modal__notice-label">{row.label}</span>
                  <span className="res-cancel-modal__notice-value">{row.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="res-cancel-modal__footer">
          <button className="res-cancel-modal__submit" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
