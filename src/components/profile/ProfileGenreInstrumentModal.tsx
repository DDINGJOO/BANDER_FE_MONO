import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PROFILE_GENRE_INSTRUMENT_MAX,
  PROFILE_MUSIC_GENRES,
  PROFILE_MUSIC_INSTRUMENTS,
} from '../../data/profileGenreInstrument';
import '../../styles/profile-genre-instrument-modal.css';

export type ProfileGenreInstrumentTab = 'genre' | 'instrument';

export type ProfileGenreInstrumentModalProps = {
  initialGenres: string[];
  initialInstruments: string[];
  initialTab?: ProfileGenreInstrumentTab;
  onApply: (genres: string[], instruments: string[]) => void;
  onClose: () => void;
  open: boolean;
};

function ModalCloseIcon() {
  return (
    <svg aria-hidden="true" className="profile-gi-modal__close-svg" fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function toggleLimited(list: string[], item: string, max: number): string[] {
  if (list.includes(item)) {
    return list.filter((x) => x !== item);
  }
  if (list.length >= max) {
    return list;
  }
  return [...list, item];
}

/** Figma 선호 장르/악기 바텀 시트형 모달 */
export function ProfileGenreInstrumentModal({
  initialGenres,
  initialInstruments,
  initialTab = 'genre',
  onApply,
  onClose,
  open,
}: ProfileGenreInstrumentModalProps) {
  const [tab, setTab] = useState<ProfileGenreInstrumentTab>(initialTab);
  const [draftGenres, setDraftGenres] = useState<string[]>(initialGenres);
  const [draftInstruments, setDraftInstruments] = useState<string[]>(initialInstruments);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTab(initialTab);
    setDraftGenres([...initialGenres]);
    setDraftInstruments([...initialInstruments]);
  }, [open, initialTab, initialGenres, initialInstruments]);

  const onKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onKey]);

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

  const resetCurrentTab = () => {
    if (tab === 'genre') {
      setDraftGenres([]);
    } else {
      setDraftInstruments([]);
    }
  };

  const toggleChip = (label: string) => {
    if (tab === 'genre') {
      setDraftGenres((prev) => toggleLimited(prev, label, PROFILE_GENRE_INSTRUMENT_MAX));
    } else {
      setDraftInstruments((prev) => toggleLimited(prev, label, PROFILE_GENRE_INSTRUMENT_MAX));
    }
  };

  const canComplete = draftGenres.length > 0 || draftInstruments.length > 0;

  const chips = tab === 'genre' ? PROFILE_MUSIC_GENRES : PROFILE_MUSIC_INSTRUMENTS;
  const selected = tab === 'genre' ? draftGenres : draftInstruments;

  const apply = () => {
    if (!canComplete) {
      return;
    }
    onApply(draftGenres, draftInstruments);
    onClose();
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="profile-gi-modal">
      <button aria-label="닫기" className="profile-gi-modal__backdrop" onClick={onClose} type="button" />
      <div
        className="profile-gi-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-gi-modal-title"
      >
        <div className="profile-gi-modal__header">
          <h2 className="profile-gi-modal__title" id="profile-gi-modal-title">
            선호하는 장르/악기
          </h2>
          <button
            type="button"
            className="profile-gi-modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            <ModalCloseIcon />
          </button>
        </div>

        <div className="profile-gi-modal__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'genre'}
            className={`profile-gi-modal__tab${tab === 'genre' ? ' profile-gi-modal__tab--active' : ''}`}
            onClick={() => setTab('genre')}
          >
            <span className="profile-gi-modal__tab-label">장르</span>
            <span className="profile-gi-modal__tab-line" aria-hidden />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'instrument'}
            className={`profile-gi-modal__tab${tab === 'instrument' ? ' profile-gi-modal__tab--active' : ''}`}
            onClick={() => setTab('instrument')}
          >
            <span className="profile-gi-modal__tab-label">악기</span>
            <span className="profile-gi-modal__tab-line" aria-hidden />
          </button>
        </div>

        <div className="profile-gi-modal__body" role="tabpanel">
          <p className="profile-gi-modal__hint">각 최대 3개까지 선택가능합니다.</p>
          <div className="profile-gi-modal__chips">
            {chips.map((label) => {
              const isOn = selected.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  className={`profile-gi-modal__chip${isOn ? ' profile-gi-modal__chip--selected' : ''}`}
                  onClick={() => toggleChip(label)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="profile-gi-modal__footer">
          <button type="button" className="profile-gi-modal__btn-reset" onClick={resetCurrentTab}>
            초기화
          </button>
          <button
            type="button"
            className={`profile-gi-modal__btn-done${canComplete ? ' profile-gi-modal__btn-done--active' : ''}`}
            onClick={apply}
            disabled={!canComplete}
          >
            선택완료
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
