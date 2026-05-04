import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createCommunityPost,
  fetchCommunityPostDetail,
  updateCommunityPost,
  type CommunityPostBlockDto,
  type CommunityPostBlockType,
  uploadPostInlineImage,
} from '../api/community';
import { ApiError } from '../api/client';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { useGuestGate } from '../components/home/GuestGateProvider';
import { ChevronIcon } from '../components/shared/Icons';
import { resolveProfileImageUrl } from '../config/media';
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
  id: string;
  kind: 'local';
  file: File;
  url: string;
} | {
  id: string;
  kind: 'existing';
  content: string;
  imageUrl?: string | null;
  url: string;
};

type PreservedPostBlock = {
  blockType: CommunityPostBlockType;
  content: string;
  imageUrl?: string;
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

function isLocalPhoto(photo: PhotoItem): photo is Extract<PhotoItem, { kind: 'local' }> {
  return photo.kind === 'local';
}

function isExistingPhoto(photo: PhotoItem): photo is Extract<PhotoItem, { kind: 'existing' }> {
  return photo.kind === 'existing';
}

function normalizeCategory(category: string | null | undefined) {
  return category && (COMMUNITY_WRITE_CATEGORIES as readonly string[]).includes(category)
    ? category
    : COMMUNITY_WRITE_CATEGORIES[0];
}

function normalizeTopic(topic: string | null | undefined) {
  return topic && (COMMUNITY_WRITE_TOPICS as readonly string[]).includes(topic)
    ? topic
    : COMMUNITY_WRITE_TOPICS[0];
}

function sortBlocks(blocks: CommunityPostBlockDto[]) {
  return blocks
    .slice()
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

function mapExistingPhoto(block: CommunityPostBlockDto, index: number): PhotoItem | null {
  if (block.blockType !== 'IMAGE' || !block.content) {
    return null;
  }

  return {
    content: block.content,
    id: `existing-${block.blockId ?? index}`,
    imageUrl: block.imageUrl,
    kind: 'existing',
    url: resolveProfileImageUrl(block.content, block.imageUrl) ?? block.content,
  };
}

export function CommunityWritePage() {
  const navigate = useNavigate();
  const { slug: editPostId } = useParams<{ slug?: string }>();
  const { openGuestGate } = useGuestGate();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const currentUserId = authSession ? String(authSession.userId) : null;
  const ownerKey = authSession ? String(authSession.userId) : '';
  const isEditMode = Boolean(editPostId);

  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<string>(COMMUNITY_WRITE_CATEGORIES[0]);
  const [topic, setTopic] = useState<string>(COMMUNITY_WRITE_TOPICS[0]);
  const [postTitle, setPostTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [preservedBlocks, setPreservedBlocks] = useState<PreservedPostBlock[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
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
      navigate(`/search/map?q=${encodeURIComponent(query)}`);
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
    !initialLoading &&
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
          kind: 'local',
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
    (photo: Extract<PhotoItem, { kind: 'local' }>) =>
      uploadPostInlineImage({
        file: photo.file,
        ownerKey,
      }),
    [ownerKey]
  );

  useEffect(() => {
    if (!editPostId) {
      setPreservedBlocks([]);
      return undefined;
    }

    const returnTo = `/community/post/${encodeURIComponent(editPostId)}/edit`;
    if (!isAuthenticated) {
      openGuestGate(returnTo);
      return undefined;
    }

    let active = true;
    setInitialLoading(true);
    setSubmitError('');

    fetchCommunityPostDetail(editPostId)
      .then((post) => {
        if (!active) {
          return;
        }

        if (currentUserId && String(post.authorUserId) !== currentUserId) {
          setSubmitError('내 게시글만 수정할 수 있습니다.');
          return;
        }

        const blocks = sortBlocks(post.blocks);
        const nextPhotos = blocks
          .map(mapExistingPhoto)
          .filter((photo): photo is PhotoItem => photo != null);
        const textBody = blocks
          .filter((block) => block.blockType === 'TEXT')
          .map((block) => block.content)
          .filter(Boolean)
          .join('\n\n');
        const nextPreservedBlocks = blocks
          .filter((block) => block.blockType === 'CODE' && block.content)
          .map((block) => ({
            blockType: 'CODE' as const,
            content: block.content,
            ...(block.imageUrl ? { imageUrl: block.imageUrl } : {}),
          }));

        setPostTitle(post.title);
        setCategory(normalizeCategory(post.category));
        setTopic(normalizeTopic(post.topic));
        setBody(textBody);
        setPhotos(nextPhotos);
        setPreservedBlocks(nextPreservedBlocks);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setSubmitError(getErrorMessage(error, '게시글을 불러오지 못했습니다.'));
      })
      .finally(() => {
        if (active) {
          setInitialLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentUserId, editPostId, isAuthenticated, openGuestGate]);

  const onSubmit = async () => {
    if (!canSubmit || submitting) {
      return;
    }

    if (!isAuthenticated) {
      openGuestGate('/community/write');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      let uploads: Array<{
        mediaRef: string;
        mediaId: string;
        ownershipTicket: string;
        imageUrl: string;
      }> = [];
      const localPhotos = photos.filter(isLocalPhoto);
      if (localPhotos.length > 0) {
        try {
          uploads = await Promise.all(localPhotos.map((photo) => uploadPhoto(photo)));
        } catch {
          setSubmitError('일부 이미지 업로드에 실패했습니다. 다시 시도해 주세요.');
          setSubmitting(false);
          return;
        }
      }

      const blocks: Array<{
        blockType: 'TEXT' | 'IMAGE' | 'CODE';
        content: string;
        mediaId?: string;
        ownershipTicket?: string;
        imageUrl?: string;
      }> = [
        { blockType: 'TEXT', content: body.trim() },
        ...photos.filter(isExistingPhoto).map((photo) => ({
          blockType: 'IMAGE' as const,
          content: photo.content,
          ...(photo.imageUrl ? { imageUrl: photo.imageUrl } : {}),
        })),
        ...uploads.map(({ mediaRef, mediaId, ownershipTicket, imageUrl }) => ({
          blockType: 'IMAGE' as const,
          content: mediaRef,
          mediaId,
          ownershipTicket,
          // R1-G: thread the CDN URL alongside the ref so the server can
          // persist it (post_block.image_url, V7) — drop empty/missing URLs
          // so the request stays clean for legacy stub backends.
          ...(imageUrl ? { imageUrl } : {}),
        })),
        ...preservedBlocks,
      ];

      const request = {
        title: postTitle.trim(),
        category,
        topic,
        blocks,
      };

      const savedPost = isEditMode && editPostId
        ? await updateCommunityPost(editPostId, request)
        : await createCommunityPost(request);

      navigate(isEditMode ? `/community/post/${savedPost.postId ?? editPostId}` : '/community');
    } catch (error) {
      setSubmitError(
        getErrorMessage(
          error,
          isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.'
        )
      );
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
              onClick={() => navigate(isEditMode && editPostId ? `/community/post/${editPostId}` : '/community')}
              type="button"
            >
              <span aria-hidden className="community-write__back-chevron">
                <ChevronIcon />
              </span>
            </button>
            <h1 className="community-write__title">{isEditMode ? '글 수정' : '글쓰기'}</h1>
          </div>

          {initialLoading ? (
            <p className="community-write__status" role="status">
              게시글을 불러오는 중입니다.
            </p>
          ) : null}

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
              {submitting
                ? isEditMode ? '수정 중...' : '작성 중...'
                : isEditMode ? '수정완료' : '작성완료'}
            </button>
          </div>
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
