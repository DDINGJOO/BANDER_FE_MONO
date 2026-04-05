import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  COMMUNITY_REPORT_DETAIL_MAX,
  COMMUNITY_REPORT_DETAIL_PLACEHOLDER,
  COMMUNITY_REPORT_REASONS,
} from '../../data/communityReportModal';

export type CommunityReportModalProps = {
  onClose: () => void;
  onSubmitted?: () => void;
  open: boolean;
};

function LockGlyph20() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M7 9V7a3 3 0 0 1 6 0v2M5.5 9h9A1.5 1.5 0 0 1 16 10.5v5A1.5 1.5 0 0 1 14.5 17h-9A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9Z"
        stroke="#a3a9b5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function CloseGlyph20() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

function ChevronDown14() {
  return (
    <svg aria-hidden="true" className="community-report-modal__chevron" fill="none" height="14" viewBox="0 0 14 14" width="14">
      <path d="M3.5 5.25L7 8.75l3.5-3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
    </svg>
  );
}

function ClipGlyph20() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path
        d="M12.5 6.5 7 12a2.2 2.2 0 1 0 3.1 3.1l6.2-6.2a3.7 3.7 0 0 0-5.25-5.25L5.35 9.35"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

/** Figma 6435:27424 본문 + 6539:37162 신고 카테고리 드롭다운 */
export function CommunityReportModal({ onClose, onSubmitted, open }: CommunityReportModalProps) {
  const titleId = useId();
  const [reason, setReason] = useState<string>(COMMUNITY_REPORT_REASONS[0]);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [detail, setDetail] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const reasonWrapRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(() => {
    setReason(COMMUNITY_REPORT_REASONS[0]);
    setReasonOpen(false);
    setDetail('');
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!reasonOpen) return;
    const onDoc = (event: MouseEvent) => {
      const node = reasonWrapRef.current;
      if (node && !node.contains(event.target as Node)) setReasonOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [reasonOpen]);

  if (!open) return null;

  const canSubmit = detail.trim().length > 0;
  const detailLen = Math.min(detail.length, COMMUNITY_REPORT_DETAIL_MAX);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmitted?.();
    onClose();
  };

  return createPortal(
    <div className="community-report-modal">
      <button aria-label="닫기" className="community-report-modal__backdrop" onClick={onClose} type="button" />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="community-report-modal__dialog"
        role="dialog"
      >
        <header className="community-report-modal__header">
          <p className="community-report-modal__header-title" id={titleId}>
            신고하기
          </p>
          <button
            aria-label="닫기"
            className="community-report-modal__close"
            onClick={onClose}
            type="button"
          >
            <CloseGlyph20 />
          </button>
        </header>

        <div className="community-report-modal__body">
          <h2 className="community-report-modal__headline">어떤 문제가 있나요?</h2>

          <div className="community-report-modal__privacy">
            <LockGlyph20 />
            <p className="community-report-modal__privacy-text">이 정보는 밴더만 볼 수 있습니다.</p>
          </div>

          <div className="community-report-modal__select-wrap" ref={reasonWrapRef}>
            <button
              aria-expanded={reasonOpen}
              className="community-report-modal__select-trigger"
              onClick={() => setReasonOpen((o) => !o)}
              type="button"
            >
              <span className="community-report-modal__select-value">{reason}</span>
              <ChevronDown14 />
            </button>
            {reasonOpen ? (
              <ul aria-label="신고 카테고리" className="community-report-modal__select-menu" role="listbox">
                {COMMUNITY_REPORT_REASONS.map((opt) => (
                  <li key={opt}>
                    <button
                      aria-selected={opt === reason}
                      className={`community-report-modal__select-option${opt === reason ? ' community-report-modal__select-option--active' : ''}`}
                      onClick={() => {
                        setReason(opt);
                        setReasonOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="community-report-modal__field">
            <textarea
              className="community-report-modal__textarea"
              maxLength={COMMUNITY_REPORT_DETAIL_MAX}
              onChange={(e) => setDetail(e.target.value)}
              placeholder={COMMUNITY_REPORT_DETAIL_PLACEHOLDER}
              rows={5}
              value={detail}
            />
            <p className="community-report-modal__counter">
              {detailLen}/{COMMUNITY_REPORT_DETAIL_MAX}
            </p>
          </div>

          <input
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            className="community-report-modal__file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f ? f.name : null);
            }}
            ref={fileInputRef}
            type="file"
          />
          <button
            className="community-report-modal__attach"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <span className="community-report-modal__attach-icon" aria-hidden>
              <ClipGlyph20 />
            </span>
            <span className="community-report-modal__attach-label">{fileName || '파일첨부'}</span>
          </button>
          <p className="community-report-modal__attach-hint">
            <span aria-hidden className="community-report-modal__attach-dot" />
            최대 5MB까지 사진 첨부 가능합니다. (pdf, png, jpg)
          </p>
        </div>

        <footer className="community-report-modal__footer">
          <button
            className="community-report-modal__submit"
            disabled={!canSubmit}
            onClick={handleSubmit}
            type="button"
          >
            신고하기
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
