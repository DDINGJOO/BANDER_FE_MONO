import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  COMMUNITY_WRITE_BODY_MAX,
  COMMUNITY_WRITE_CATEGORIES,
  COMMUNITY_WRITE_PHOTO_MAX,
  COMMUNITY_WRITE_TITLE_MAX,
  COMMUNITY_WRITE_TOPICS,
} from '../data/communityWrite';

function CameraGlyph40() {
  return (
    <svg
      aria-hidden="true"
      className="community-write__photo-add-icon"
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

export function CommunityWritePage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<string>(COMMUNITY_WRITE_CATEGORIES[0]);
  const [topic, setTopic] = useState<string>(COMMUNITY_WRITE_TOPICS[0]);
  const [postTitle, setPostTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const photoInputId = useId();

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
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

  const canSubmit =
    Boolean(category) &&
    Boolean(topic) &&
    postTitle.trim().length > 0 &&
    body.trim().length > 0;

  const onPickPhotos = (files: FileList | null) => {
    if (!files?.length) return;
    setPhotos((prev) => {
      const next = [...prev];
      for (let i = 0; i < files.length && next.length < COMMUNITY_WRITE_PHOTO_MAX; i += 1) {
        const f = files.item(i);
        if (!f || !f.type.startsWith('image/')) continue;
        next.push({
          id: `${f.name}-${f.size}-${next.length}-${Date.now()}`,
          url: URL.createObjectURL(f),
        });
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
    navigate('/community');
  };

  return (
    <main className="community-write-page">
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

      <div className="community-write-page__main">
        <div className="community-write">
          <div className="community-write__head">
            <button
              type="button"
              className="community-write__back"
              onClick={() => navigate('/community')}
              aria-label="뒤로"
            >
              <span className="community-write__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="community-write__title">글쓰기</h1>
          </div>

          <div className="community-write__field">
            <label className="community-write__label" htmlFor="community-write-category">
              카테고리
            </label>
            <select
              className="community-write__select"
              id="community-write-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {COMMUNITY_WRITE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="community-write__field">
            <label className="community-write__label" htmlFor="community-write-topic">
              주제
            </label>
            <select
              className="community-write__select"
              id="community-write-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {COMMUNITY_WRITE_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="community-write__field">
            <label className="community-write__label" htmlFor="community-write-title">
              제목
            </label>
            <input
              className="community-write__input"
              id="community-write-title"
              maxLength={COMMUNITY_WRITE_TITLE_MAX}
              placeholder="제목을 입력해 주세요."
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
            />
          </div>

          <div className="community-write__field">
            <label className="community-write__label" htmlFor="community-write-body">
              본문
            </label>
            <div className="community-write__textarea-wrap">
              <textarea
                className="community-write__textarea"
                id="community-write-body"
                maxLength={COMMUNITY_WRITE_BODY_MAX}
                placeholder="내용을 입력해 주세요."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <p className="community-write__char-count" aria-live="polite">
              {body.length}/{COMMUNITY_WRITE_BODY_MAX}
            </p>
          </div>

          <input
            ref={fileInputRef}
            accept="image/*"
            className="sr-only"
            id={photoInputId}
            multiple
            onChange={(e) => onPickPhotos(e.target.files)}
            type="file"
          />

          <p className="community-write__label">이미지 ({photos.length}/{COMMUNITY_WRITE_PHOTO_MAX})</p>
          <div className="community-write__photos">
            {photos.map((p) => (
              <div key={p.id} className="community-write__photo-thumb">
                <img alt="" src={p.url} />
                <button
                  type="button"
                  className="community-write__photo-remove"
                  aria-label="사진 삭제"
                  onClick={() => removePhoto(p.id)}
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < COMMUNITY_WRITE_PHOTO_MAX ? (
              <button
                type="button"
                className="community-write__photo-add"
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraGlyph40 />
                <p className="community-write__photo-count">
                  {photos.length}/{COMMUNITY_WRITE_PHOTO_MAX}
                </p>
              </button>
            ) : null}
          </div>

          <div className="community-write__submit-wrap">
            <button
              type="button"
              className={`community-write__submit${canSubmit ? ' community-write__submit--enabled' : ' community-write__submit--disabled'}`}
              disabled={!canSubmit}
              onClick={onSubmit}
            >
              작성완료
            </button>
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
