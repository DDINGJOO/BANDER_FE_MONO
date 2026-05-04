import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  REVIEW_WRITE_DEMO_BODY,
  REVIEW_WRITE_DEMO_IMAGE_URLS,
} from '../data/reviewWriteDemo';

const REVIEW_MAX_LENGTH = 80;
const PHOTO_MAX = 5;

/** Figma 6163:41948 — 채운 별: Main Yellow, 빈 별: Gray 4 */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 50 50" width="50" height="50">
      <path
        d="M25 6.5l5.8 14.4 15.6 1.2-12 10.2 3.7 15.2L25 39.9l-13.1 7.6 3.7-15.2-12-10.2 15.6-1.2L25 6.5z"
        fill={filled ? '#f6d155' : 'none'}
        stroke={filled ? '#f6d155' : '#c4c9d4'}
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CameraGlyph40() {
  return (
    <svg
      aria-hidden="true"
      className="review-write__photo-add-icon"
      fill="none"
      viewBox="0 0 40 40"
      width="40"
      height="40"
    >
      <path
        d="M8.33 12.5h4.17L15 10h10l2.5 2.5h4.17c.92 0 1.66.75 1.66 1.67v16.66c0 .92-.74 1.67-1.66 1.67H8.33c-.92 0-1.66-.75-1.66-1.67V14.17c0-.92.74-1.67 1.66-1.67z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="22.5" r="5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

type PhotoItem = { id: string; url: string };

export function ReviewWritePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demoFilled = searchParams.get('demo') === 'filled';
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const photoInputId = useId();

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search/map?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerSearchRef.current?.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        if (p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
      });
    };
  }, []);

  const demoAppliedRef = useRef(false);
  useEffect(() => {
    if (!demoFilled || demoAppliedRef.current) return;
    demoAppliedRef.current = true;
    setRating(4);
    setText(REVIEW_WRITE_DEMO_BODY.slice(0, REVIEW_MAX_LENGTH));
    setPhotos(
      REVIEW_WRITE_DEMO_IMAGE_URLS.map((url, i) => ({
        id: `demo-img-${i}`,
        url,
      })),
    );
  }, [demoFilled]);

  const displayStars = hoverRating || rating;
  /** 확정 점수 기준 (Figma 6163:41948 · 호버로 문구가 바뀌지 않게) */
  const showSatisfiedLabel = rating >= 4;
  const canSubmit = rating >= 1 && text.trim().length > 0;

  const onPickPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    setPhotos((prev) => {
      const next = [...prev];
      for (let i = 0; i < files.length && next.length < PHOTO_MAX; i += 1) {
        const f = files.item(i);
        if (!f || !f.type.startsWith('image/')) continue;
        next.push({ id: `${f.name}-${f.size}-${next.length}-${Date.now()}`, url: URL.createObjectURL(f) });
      }
      return next;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    navigate('/my-reservations');
  };

  return (
    <main className="review-write-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate('/login')}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery('');
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() =>
          setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))
        }
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="review-write-page__main">
        <div className="review-write">
          <div className="review-write__head">
            <button
              type="button"
              className="review-write__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="review-write__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="review-write__title">리뷰쓰기</h1>
          </div>

          <p
            className={`review-write__rating-label${showSatisfiedLabel ? ' review-write__rating-label--center' : ''}`}
          >
            {showSatisfiedLabel ? '만족해요!' : '얼마나 만족하셨나요?'}
          </p>
          <ul className="review-write__stars" role="presentation">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n}>
                <button
                  type="button"
                  className="review-write__star-btn"
                  aria-label={`${n}점`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <StarIcon filled={n <= displayStars} />
                </button>
              </li>
            ))}
          </ul>

          <div className="review-write__textarea-wrap">
            <label className="sr-only" htmlFor="review-write-text">
              리뷰 내용
            </label>
            <textarea
              id="review-write-text"
              className="review-write__textarea"
              maxLength={REVIEW_MAX_LENGTH}
              placeholder="업체에 대한 상세한 리뷰를 남겨주세요."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <p className="review-write__char-count" aria-live="polite">
            {text.length}/{REVIEW_MAX_LENGTH}
          </p>

          <input
            ref={fileInputRef}
            id={photoInputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => onPickPhotos(e.target.files)}
          />

          <div className="review-write__photos">
            {photos.map((p) => (
              <div key={p.id} className="review-write__photo-thumb">
                <img alt="" src={p.url} />
                <button
                  type="button"
                  className="review-write__photo-remove"
                  aria-label="사진 삭제"
                  onClick={() => removePhoto(p.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < PHOTO_MAX ? (
              <button
                type="button"
                className="review-write__photo-add"
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraGlyph40 />
                <p className="review-write__photo-count">
                  {photos.length}/{PHOTO_MAX}
                </p>
              </button>
            ) : null}
          </div>

          <div className="review-write__submit-wrap">
            <button
              type="button"
              className={`review-write__submit${canSubmit ? ' review-write__submit--enabled' : ' review-write__submit--disabled'}`}
              disabled={!canSubmit}
              onClick={onSubmit}
            >
              완료
            </button>
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
