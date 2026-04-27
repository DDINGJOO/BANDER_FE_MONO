import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createCommunityPost,
  uploadPostInlineImage,
} from '../api/community';
import { ApiError } from '../api/client';
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
      height="40"
      viewBox="0 0 40 40"
      width="40"
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

type PhotoItem = {
  file: File;
  id: string;
  url: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function CommunityWritePage() {
  const navigate = useNavigate();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const ownerKey = authSession ? String(authSession.userId) : '';

  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<string>(COMMUNITY_WRITE_CATEGORIES[0]);
  const [topic, setTopic] = useState<string>(COMMUNITY_WRITE_TOPICS[0]);
  const [postTitle, setPostTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const photoInputId = useId();

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const onHeaderSearchSubmit = useCallback(
    (value: string) => {
      const query = value.trim();
      if (!query) {
        return;
      }
      navigate(`/search?q=${encodeURIComponent(query)}`);
    },
    [navigate]
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
      photosRef.current.forEach((photo) => {
        if (photo.url?.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, []);

  const canSubmit =
    Boolean(category) &&
    Boolean(topic) &&
    postTitle.trim().length > 0 &&
    body.trim().length > 0;

  const onPickPhotos = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setPhotos((current) => {
      const next = [...current];
      for (let index = 0; index < files.length && next.length < COMMUNITY_WRITE_PHOTO_MAX; index += 1) {
        const file = files[index] ?? files.item(index);
        if (!file || !file.type.startsWith('image/')) {
          continue;
        }
        next.push({
          file,
          id: `${file.name}-${file.size}-${next.length}-${Date.now()}`,
          url: URL.createObjectURL(file),
        });
      }
      return next;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target?.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return current.filter((photo) => photo.id !== id);
    });
  };

  const uploadPhoto = useCallback(
    (photo: PhotoItem) =>
      uploadPostInlineImage({
        file: photo.file,
        ownerKey,
      }),
    [ownerKey]
  );

  const onSubmit = async () => {
    if (!canSubmit || submitting) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login?returnTo=%2Fcommunity%2Fwrite');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      let uploads: Array<{ mediaRef: string; ownershipTicket: string }> = [];
      if (photos.length > 0) {
        try {
          uploads = await Promise.all(photos.map((photo) => uploadPhoto(photo)));
        } catch {
          setSubmitError('일부 이미지 업로드에 실패했습니다. 다시 시도해 주세요.');
          setSubmitting(false);
          return;
        }
      }

      const blocks: Array<{
        blockType: 'TEXT' | 'IMAGE' | 'CODE';
        content: string;
        ownershipTicket?: string;
      }> = [
        { blockType: 'TEXT', content: body.trim() },
        ...uploads.map(({ mediaRef, ownershipTicket }) => ({
          blockType: 'IMAGE' as const,
          content: mediaRef,
          ownershipTicket,
        })),
      ];

      await createCommunityPost({
        title: postTitle.trim(),
        category,
        topic,
        blocks,
      });

      navigate('/community');
    } catch (error) {
      setSubmitError(getErrorMessage(error, '게시글 작성에 실패했습니다.'));
      setSubmitting(false);
    }
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
              aria-label="뒤로"
              className="community-write__back"
              onClick={() => navigate('/community')}
              type="button"
            >
              <span aria-hidden className="community-write__back-chevron">
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
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              {COMMUNITY_WRITE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
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
              onChange={(event) => setTopic(event.target.value)}
              value={topic}
            >
              {COMMUNITY_WRITE_TOPICS.map((option) => (
                <option key={option} value={option}>
                  {option}
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
              onChange={(event) => setPostTitle(event.target.value)}
              placeholder="제목을 입력해 주세요."
              type="text"
              value={postTitle}
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
                onChange={(event) => setBody(event.target.value)}
                placeholder="내용을 입력해 주세요."
                value={body}
              />
            </div>
            <p aria-live="polite" className="community-write__char-count">
              {body.length}/{COMMUNITY_WRITE_BODY_MAX}
            </p>
          </div>

          <input
            accept="image/*"
            aria-label="이미지 업로드"
            className="sr-only"
            id={photoInputId}
            multiple
            onChange={(event) => onPickPhotos(event.target.files)}
            ref={fileInputRef}
            type="file"
          />

          <p className="community-write__label">
            이미지 ({photos.length}/{COMMUNITY_WRITE_PHOTO_MAX})
          </p>
          <div className="community-write__photos">
            {photos.map((photo) => (
              <div className="community-write__photo-thumb" key={photo.id}>
                <img alt="" src={photo.url} />
                <button
                  aria-label="사진 삭제"
                  className="community-write__photo-remove"
                  onClick={() => removePhoto(photo.id)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < COMMUNITY_WRITE_PHOTO_MAX ? (
              <button
                className="community-write__photo-add"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <CameraGlyph40 />
                <p className="community-write__photo-count">
                  {photos.length}/{COMMUNITY_WRITE_PHOTO_MAX}
                </p>
              </button>
            ) : null}
          </div>

          <div className="community-write__submit-wrap">
            {submitError ? (
              <p
                role="status"
                style={{ color: '#d14b4b', fontSize: 13, marginBottom: 8, textAlign: 'center' }}
              >
                {submitError}
              </p>
            ) : null}
            <button
              className={`community-write__submit${
                canSubmit
                  ? ' community-write__submit--enabled'
                  : ' community-write__submit--disabled'
              }`}
              disabled={!canSubmit || submitting}
              onClick={() => void onSubmit()}
              type="button"
            >
              {submitting ? '작성 중...' : '작성완료'}
            </button>
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
