import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { ChevronIcon } from '../components/shared/Icons';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { loadAuthSession } from '../data/authSession';
import {
  MINI_FEED_COMMENTED_POSTS,
  MINI_FEED_PROFILE,
  MINI_FEED_SORT_OPTIONS,
  MINI_FEED_WRITTEN_POSTS,
  type MiniFeedPost,
} from '../data/myMiniFeed';

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

function MiniFeedPostCard({ post }: { post: MiniFeedPost }) {
  const inner = (
    <div className="my-mini-feed-card__inner">
        <span className="my-mini-feed-card__category">{post.category}</span>
        <div className="my-mini-feed-card__row">
          <div className="my-mini-feed-card__body">
            <h2 className="my-mini-feed-card__title">{post.title}</h2>
            <div className="my-mini-feed-card__excerpt">
              {post.excerptLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="my-mini-feed-card__meta">
              <div className="my-mini-feed-card__meta-block">
                <div className="my-mini-feed-card__meta-who">
                  <img
                    alt=""
                    className="my-mini-feed-card__meta-avatar"
                    height={16}
                    src={post.authorAvatar}
                    width={16}
                  />
                  <span className="my-mini-feed-card__meta-name">{post.authorName}</span>
                </div>
                <span className="my-mini-feed-card__dot" aria-hidden />
                <span className="my-mini-feed-card__meta-time">{post.timeLabel}</span>
              </div>
              <div className="my-mini-feed-card__stats">
                <span className="my-mini-feed-card__stat">
                  <LikeGlyph14 />
                  {post.likes}
                </span>
                <span className="my-mini-feed-card__dot" aria-hidden />
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
  const feedTab = searchParams.get('tab') === 'commented' ? 'commented' : 'written';

  const setFeedTab = (tab: 'written' | 'commented') => {
    if (tab === 'commented') setSearchParams({ tab: 'commented' }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>(MINI_FEED_SORT_OPTIONS[0]);

  const posts = feedTab === 'written' ? MINI_FEED_WRITTEN_POSTS : MINI_FEED_COMMENTED_POSTS;

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      const q = value.trim();
      if (!q) return;
      navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!headerSearchRef.current?.contains(target)) setHeaderSearchOpen(false);
      if (!sortRef.current?.contains(target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

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
            type="button"
            className="my-mini-feed-page__back"
            onClick={() => navigate('/')}
            aria-label="뒤로"
          >
            <span className="my-mini-feed-page__back-chevron" aria-hidden>
              <ChevronIcon />
            </span>
          </button>
          <h1 className="my-mini-feed-page__heading">내 미니피드</h1>
        </div>

        <div className="my-mini-feed-page__profile-row">
          <div className="my-mini-feed-page__profile-left">
            <img
              alt=""
              className="my-mini-feed-page__avatar"
              height={200}
              src={MINI_FEED_PROFILE.profileImageUrl}
              width={200}
            />
            <div className="my-mini-feed-page__profile-text">
              <div>
                <p className="my-mini-feed-page__nickname">{MINI_FEED_PROFILE.nickname}</p>
                <p className="my-mini-feed-page__join">{MINI_FEED_PROFILE.joinLabel}</p>
              </div>
              <p className="my-mini-feed-page__bio">{MINI_FEED_PROFILE.bio}</p>
              <div className="my-mini-feed-page__tags">
                {MINI_FEED_PROFILE.tags.map((tag) => (
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
            type="button"
            className={
              feedTab === 'written'
                ? 'my-mini-feed-page__tab my-mini-feed-page__tab--active'
                : 'my-mini-feed-page__tab'
            }
            onClick={() => setFeedTab('written')}
            role="tab"
            aria-selected={feedTab === 'written'}
          >
            작성한 글
          </button>
          <button
            type="button"
            className={
              feedTab === 'commented'
                ? 'my-mini-feed-page__tab my-mini-feed-page__tab--active'
                : 'my-mini-feed-page__tab'
            }
            onClick={() => setFeedTab('commented')}
            role="tab"
            aria-selected={feedTab === 'commented'}
          >
            댓글단 글
          </button>
        </div>

        <div className="my-mini-feed-page__feed-head">
          <p className="my-mini-feed-page__count">{posts.length}개의 게시글</p>
          <div className="my-mini-feed-page__sort-wrap" ref={sortRef}>
            <button
              type="button"
              className="my-mini-feed-page__sort-trigger"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((o) => !o)}
            >
              {sortBy}
              <span className="my-mini-feed-page__sort-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            {sortOpen ? (
              <div className="my-mini-feed-page__sort-menu" role="listbox">
                {MINI_FEED_SORT_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    className="my-mini-feed-page__sort-option"
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setSortOpen(false);
                    }}
                    role="option"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="my-mini-feed-page__list">
          {posts.map((post, i) => (
            <MiniFeedPostCard
              key={`${feedTab}-${i}-${post.title}-${post.timeLabel}`}
              post={post}
            />
          ))}
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
