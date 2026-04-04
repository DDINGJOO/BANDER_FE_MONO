import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BANDER_USAGE_POLICY_SECTIONS } from '../../data/banderUsagePolicy';

type BanderUsagePolicyModalProps = {
  onClose: () => void;
  open: boolean;
};

export function BanderUsagePolicyModal({ onClose, open }: BanderUsagePolicyModalProps) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !modalRoot) {
    return null;
  }

  return createPortal(
    <div className="bander-policy-modal">
      <div aria-hidden="true" className="bander-policy-modal__backdrop" onClick={onClose} />
      <div
        aria-labelledby="bander-policy-modal-title"
        aria-modal="true"
        className="bander-policy-modal__dialog"
        role="dialog"
      >
        <div className="bander-policy-modal__header">
          <h2 className="bander-policy-modal__title" id="bander-policy-modal-title">
            밴더 이용정책
          </h2>
          <button
            aria-label="닫기"
            className="bander-policy-modal__close"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 20 20" width="20">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <div className="bander-policy-modal__body">
          <div className="bander-policy-modal__sections">
            {BANDER_USAGE_POLICY_SECTIONS.map((section) => (
              <section className="bander-policy-modal__section" key={section.title}>
                <h3 className="bander-policy-modal__section-title">
                  <span className="bander-policy-modal__section-sq" aria-hidden="true" />
                  {section.title}
                </h3>
                <div className="bander-policy-modal__bullets">
                  {section.bullets.map((bullet, index) => {
                    const lines = typeof bullet === 'string' ? [bullet] : [...bullet];
                    return (
                      <div className="bander-policy-modal__bullet" key={`${section.title}-${index}`}>
                        <span className="bander-policy-modal__bullet-bar" aria-hidden="true" />
                        <div className="bander-policy-modal__bullet-text">
                          {lines.map((line, lineIndex) => (
                            <p key={`${index}-${lineIndex}`}>{line}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
