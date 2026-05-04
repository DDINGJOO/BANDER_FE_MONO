import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import { INQUIRY_CATEGORIES } from '../data/support';

const MAX_BODY = 80;
const MAX_IMAGES = 5;

export function InquiryNewPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const [category, setCategory] = useState<string>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const filteredSuggestions = useMemo(
    () =>
      HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
        item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
      ),
    [headerSearchQuery],
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

  const canSubmit = category !== '' && title.trim().length > 0 && body.trim().length > 0;

  const onSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!canSubmit) return;
      // TODO: POST /api/v1/inquiries 연동. 성공 시 목록으로 이동.
      navigate('/support?tab=inquiry');
    },
    [canSubmit, navigate],
  );

  const onAddImage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length === 0) return;
      setImages((prev) => {
        const next = [...prev];
        for (const file of files) {
          if (next.length >= MAX_IMAGES) break;
          next.push(URL.createObjectURL(file));
        }
        return next;
      });
      event.target.value = '';
    },
    [],
  );

  const onRemoveImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <main className="inquiry-new-page">
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
        onSearchFocus={() => setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))}
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="inquiry-new-page__main">
        <form className="inquiry-new" noValidate onSubmit={onSubmit}>
          <div className="inquiry-new__head">
            <button
              aria-label="뒤로"
              className="inquiry-new__back"
              onClick={() => navigate(-1)}
              type="button"
            >
              <span aria-hidden className="inquiry-new__back-chevron">
                <ChevronIcon />
              </span>
            </button>
            <h1 className="inquiry-new__title">궁금한 사항을 문의해주세요.</h1>
          </div>

          <p className="inquiry-new__hours">
            고객센터 운영시간 월~금 09:00 ~ 18:00
            <br />
            점심시간 12:00 ~ 13:00
          </p>

          <div className="inquiry-new__field">
            <label className="inquiry-new__label">문의 분야</label>
            <div className="inquiry-new__dropdown">
              <button
                aria-expanded={dropdownOpen}
                aria-haspopup="listbox"
                className="inquiry-new__dropdown-button"
                onClick={() => setDropdownOpen((v) => !v)}
                type="button"
              >
                <span
                  className={
                    category
                      ? 'inquiry-new__dropdown-value'
                      : 'inquiry-new__dropdown-value inquiry-new__dropdown-value--placeholder'
                  }
                >
                  {category || '문의 분야를 선택해주세요.'}
                </span>
                <span aria-hidden className="inquiry-new__dropdown-arrow">
                  <ChevronIcon />
                </span>
              </button>
              {dropdownOpen ? (
                <ul className="inquiry-new__dropdown-menu" role="listbox">
                  {INQUIRY_CATEGORIES.map((opt) => (
                    <li key={opt}>
                      <button
                        className="inquiry-new__dropdown-option"
                        onClick={() => {
                          setCategory(opt);
                          setDropdownOpen(false);
                        }}
                        role="option"
                        aria-selected={category === opt}
                        type="button"
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          <div className="inquiry-new__field">
            <label className="inquiry-new__label" htmlFor="inquiry-title">
              문의 내용
            </label>
            <input
              className="inquiry-new__input"
              id="inquiry-title"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력해주세요."
              type="text"
              value={title}
            />
            <textarea
              aria-label="문의 상세 내용"
              className="inquiry-new__textarea"
              maxLength={MAX_BODY}
              onChange={(event) => setBody(event.target.value)}
              placeholder="상세하게 작성해주시면 문제를 빠르게 해결드리겠습니다."
              value={body}
            />
            <span className="inquiry-new__counter">
              {body.length}/{MAX_BODY}
            </span>
          </div>

          <div className="inquiry-new__images">
            <label
              className={`inquiry-new__image-upload${
                images.length >= MAX_IMAGES ? ' inquiry-new__image-upload--disabled' : ''
              }`}
              aria-label="사진 추가"
            >
              <input
                accept="image/*"
                multiple
                onChange={onAddImage}
                style={{ display: 'none' }}
                type="file"
                disabled={images.length >= MAX_IMAGES}
              />
              <svg aria-hidden fill="none" height={40} viewBox="0 0 40 40" width={40}>
                <path
                  d="M13.33 15H26.66C28.5 15 30 16.5 30 18.33V28.33C30 30.16 28.5 31.66 26.66 31.66H13.33C11.5 31.66 10 30.16 10 28.33V18.33C10 16.5 11.5 15 13.33 15Z"
                  stroke="#AFB5C2"
                  strokeWidth="1.6"
                />
                <circle cx="20" cy="23.33" fill="none" r="4.5" stroke="#AFB5C2" strokeWidth="1.6" />
              </svg>
              <span className="inquiry-new__image-counter">
                {images.length}/{MAX_IMAGES}
              </span>
            </label>
            {images.map((url, idx) => (
              <div className="inquiry-new__image-thumb" key={`${url}-${idx}`}>
                <img alt="" src={url} />
                <button
                  aria-label={`사진 ${idx + 1} 삭제`}
                  className="inquiry-new__image-remove"
                  onClick={() => onRemoveImage(idx)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button className="inquiry-new__submit" disabled={!canSubmit} type="submit">
            1:1 문의하기
          </button>
        </form>
      </div>

      <HomeFooter />
    </main>
  );
}
