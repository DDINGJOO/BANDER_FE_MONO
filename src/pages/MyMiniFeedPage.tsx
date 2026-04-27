import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchMyMiniFeed,
  normalizeMiniFeedPage,
  type MiniFeedPostDto,
  type MiniFeedProfileDto,
  type MiniFeedSort,
  type MiniFeedTab,
} from '../api/community';
import { ApiError } from '../api/client';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { resolveProfileImageUrl } from '../config/media';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';

function LikeGlyph14() {
  return (
    <svg
      aria-hidden="true"
      className="my-mini-feed-card__stat-icon"
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
    >
      <path
        d="M12 20.1 4.6 13.2C3.26 11.98 3.04 10.13 3.94 8.68 4.82 7.27 6.64 6.92 8.04 7.7L12 10.2 15.96 7.7c1.4-.78 3.22-.43 4.1.98.9 1.45.68 3.3-.66 4.52L12 20.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CommentGlyph14() {
  return (
    <svg
      aria-hidden="true"
      className="my-mini-feed-card__stat-icon"
      fill="none"
      height="14"
      viewBox="0 0 24 24"
      width="14"
    >
      <path
        d="M5.2 5.2h13.6v7.2h-6.26l-3.06 2.6v-2.6H5.2V5.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

type MiniFeedCardModel = {
  authorAvatar?: string;
  authorName: string;
  category?: string;
  comments: number;
  detailSlug?: string;
  excerptLines: string[];
  likes: number;
  thumbnail?: string;
  timeLabel: string;
  title: string;
};

const SORT_OPTIONS: Array<{ label: string; value: MiniFeedSort }> = [
  { label: '최신순', value: 'latest' },
  { label: '인기순', value: 'popular' },
  { label: '댓글 많은 순', value: 'comments' },
];

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = String(parsed.getFullYear()).slice(-2);
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function resolveMediaUrl(ref: string | null | undefined) {
  return resolveProfileImageUrl(ref);
}

function normalizeTags(tags: MiniFeedProfileDto['tags']) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }

  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeJoinLabel(profile: MiniFeedProfileDto | null) {
  if (!profile) {
    return '';
  }

  if (profile.joinLabel) {
    return profile.joinLabel;
  }

  const createdAt = formatDateLabel(profile.createdAt);
  return createdAt ? `${createdAt} 가입` : '';
}

function toExcerptLines(post: MiniFeedPostDto) {
  if (Array.isArray(post.excerptLines) && post.excerptLines.length > 0) {
    return post.excerptLines;
  }

  const excerpt = (post.excerpt ?? '').trim();
  if (!excerpt) {
    return [];
  }

  return excerpt
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2);
}

function mapMiniFeedPost(post: MiniFeedPostDto): MiniFeedCardModel {
  const detailIdentifier = post.postId ?? post.id ?? post.detailSlug ?? post.slug ?? null;

  return {
    authorAvatar: resolveMediaUrl(
      post.authorAvatarUrl ?? post.authorAvatar ?? post.authorProfileImageRef
    ),
    authorName: post.authorName ?? post.authorNickname ?? '밴더유저',
    category: post.category ?? undefined,
    comments: post.comments ?? post.commentCount ?? 0,
    detailSlug: detailIdentifier !== null ? String(detailIdentifier) : undefined,
    excerptLines: toExcerptLines(post),
    likes: post.likes ?? post.likeCount ?? 0,
    thumbnail: resolveMediaUrl(post.thumbnailUrl ?? post.thumbnail),
    timeLabel: post.timeLabel ?? formatDateLabel(post.createdAt),
    title: post.title,
  };
}

function MiniFeedPostCard({ post }: { post: MiniFeedCardModel }) {
  const inner = (
    <div className="my-mini-feed-card__inner">
      {post.category ? (
        <span className="my-mini-feed-card__category">{post.category}</span>
      ) : null}
      <div className="my-mini-feed-card__row">
        <div className="my-mini-feed-card__body">
          <h2 className="my-mini-feed-card__title">{post.title}</h2>
          {post.excerptLines.length > 0 ? (
            <div className="my-mini-feed-card__excerpt">
              {post.excerptLines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          ) : null}
          <div className="my-mini-feed-card__meta">
            <div className="my-mini-feed-card__meta-block">
              <div className="my-mini-feed-card__meta-who">
                {post.authorAvatar ? (
                  <img
                    alt=""
                    className="my-mini-feed-card__meta-avatar"
                    height={16}
                    src={post.authorAvatar}
                    width={16}
                  />
                ) : (
                  <div
                    className="my-mini-feed-card__meta-avatar"
                    style={{ background: '#d9dee4' }}
                  />
                )}
                <span className="my-mini-feed-card__meta-name">{post.authorName}</span>
              </div>
              {post.timeLabel ? <span aria-hidden className="my-mini-feed-card__dot" /> : null}
              <span className="my-mini-feed-card__meta-time">{post.timeLabel}</span>
            </div>
            <div className="my-mini-feed-card__stats">
              <span className="my-mini-feed-card__stat">
                <LikeGlyph14 />
                {post.likes}
              </span>
              <span aria-hidden className="my-mini-feed-card__dot" />
              <span className="my-mini-feed-card__stat">
                <CommentGlyph14 />
                {post.comments}
              </span>
            </div>
          </div>
        </div>
        {post.thumbnail ? (
          <img
            alt=""
            className="my-mini-feed-card__thumb"
            height={80}
            src={post.thumbnail}
            width={80}
          />
        ) : null}
      </div>
    </div>
  );

  if (post.detailSlug) {
    return (
      <Link className="my-mini-feed-card" to={`/community/post/${post.detailSlug}`}>
        {inner}
      </Link>
    );
  }

  return <article className="my-mini-feed-card">{inner}</article>;
}

export function MyMiniFeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const feedTab: MiniFeedTab =
    searchParams.get('tab') === 'commented' ? 'commented' : 'written';
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);

  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<MiniFeedSort>('latest');
  const [profile, setProfile] = useState<MiniFeedProfileDto | null>(null);
  const [posts, setPosts] = useState<MiniFeedCardModel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? '최신순';
  const profileImageUrl = resolveMediaUrl(
    profile?.profileImageUrl ?? profile?.profileImageRef
  );
  const profileTags = useMemo(() => normalizeTags(profile?.tags), [profile?.tags]);

  const setFeedTab = (tab: MiniFeedTab) => {
    if (tab === 'commented') {
      setSearchParams({ tab: 'commented' }, { replace: true });
      return;
    }

    setSearchParams({}, { replace: true });
  };

  const handleSearchSubmit = useCallback(
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
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!headerSearchRef.current?.contains(target)) {
        setHeaderSearchOpen(false);
      }
      if (!sortRef.current?.contains(target)) {
        setSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnTo=/my-minifeed');
      return;
    }

    let active = true;

    setLoading(true);
    setErrorMessage('');

    fetchMyMiniFeed({
      page: 0,
      size: 20,
      sort: sortBy,
      tab: feedTab,
    })
      .then((response) => {
        if (!active) {
          return;
        }

        const page = normalizeMiniFeedPage(response.page);
        setProfile(response.profile);
        setPosts(page.items.map(mapMiniFeedPost));
        setTotalCount(page.totalCount);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          navigate('/login?returnTo=/my-minifeed');
          return;
        }

        setErrorMessage(getErrorMessage(error, '내 미니피드를 불러오지 못했습니다.'));
        setPosts([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [feedTab, sortBy]);

  return (
    <main className="my-mini-feed-page">
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
        onSearchSubmit={handleSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          handleSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="my-mini-feed-page__main">
        <div className="my-mini-feed-page__title-row">
          <button
            aria-label="뒤로"
            className="my-mini-feed-page__back"
            onClick={() => navigate('/')}
            type="button"
          >
            <span aria-hidden className="my-mini-feed-page__back-chevron">
              <ChevronIcon />
            </span>
          </button>
          <h1 className="my-mini-feed-page__heading">내 미니피드</h1>
        </div>

        <div className="my-mini-feed-page__profile-row">
          <div className="my-mini-feed-page__profile-left">
            {profileImageUrl ? (
              <img
                alt=""
                className="my-mini-feed-page__avatar"
                height={200}
                src={profileImageUrl}
                width={200}
              />
            ) : (
              <div
                className="my-mini-feed-page__avatar"
                style={{ background: '#e5eaf0' }}
              />
            )}
            <div className="my-mini-feed-page__profile-text">
              <div>
                <p className="my-mini-feed-page__nickname">
                  {profile?.nickname ?? '내 프로필'}
                </p>
                <p className="my-mini-feed-page__join">{normalizeJoinLabel(profile)}</p>
              </div>
              <p className="my-mini-feed-page__bio">{profile?.bio ?? ''}</p>
              <div className="my-mini-feed-page__tags">
                {profileTags.map((tag) => (
                  <span className="my-mini-feed-page__tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link className="my-mini-feed-page__edit" to="/profile/edit">
            수정하기
          </Link>
        </div>

        <div className="my-mini-feed-page__tabs" role="tablist">
          <button
            aria-selected={feedTab === 'written'}
            className={
              feedTab === 'written'
                ? 'my-mini-feed-page__tab my-mini-feed-page__tab--active'
                : 'my-mini-feed-page__tab'
            }
            onClick={() => setFeedTab('written')}
            role="tab"
            type="button"
          >
            작성한 글
          </button>
          <button
            aria-selected={feedTab === 'commented'}
            className={
              feedTab === 'commented'
                ? 'my-mini-feed-page__tab my-mini-feed-page__tab--active'
                : 'my-mini-feed-page__tab'
            }
            onClick={() => setFeedTab('commented')}
            role="tab"
            type="button"
          >
            댓글단 글
          </button>
        </div>

        <div className="my-mini-feed-page__feed-head">
          <p className="my-mini-feed-page__count">
            {loading ? '불러오는 중...' : `${totalCount}개의 게시글`}
          </p>
          <div className="my-mini-feed-page__sort-wrap" ref={sortRef}>
            <button
              aria-expanded={sortOpen}
              className="my-mini-feed-page__sort-trigger"
              onClick={() => setSortOpen((current) => !current)}
              type="button"
            >
              {sortLabel}
              <span aria-hidden className="my-mini-feed-page__sort-chevron">
                <ChevronIcon />
              </span>
            </button>
            {sortOpen ? (
              <div className="my-mini-feed-page__sort-menu" role="listbox">
                {SORT_OPTIONS.map((option) => (
                  <button
                    aria-selected={sortBy === option.value}
                    className="my-mini-feed-page__sort-option"
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setSortOpen(false);
                    }}
                    role="option"
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <p
            className="my-mini-feed-page__bio"
            role="status"
            style={{ color: '#d14b4b', marginBottom: 20 }}
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="my-mini-feed-page__list">
          {!loading && posts.length === 0 ? (
            <p className="my-mini-feed-page__bio">표시할 게시글이 없습니다.</p>
          ) : (
            posts.map((post, index) => (
              <MiniFeedPostCard
                key={post.detailSlug ?? `${feedTab}-${index}`}
                post={post}
              />
            ))
          )}
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
