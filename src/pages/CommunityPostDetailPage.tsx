import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPostComments, fetchPostDetail, type CommentTreeDto, type PostDetailDto } from '../api/community';
import { CommunityPostReportConfirmModal } from '../components/community/CommunityPostReportConfirmModal';
import { CommunityReportModal } from '../components/community/CommunityReportModal';
import { CommunityReplyDeleteModal } from '../components/community/CommunityReplyDeleteModal';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { isMockMode } from '../config/publicEnv';
import { loadAuthSession } from '../data/authSession';
import {
  getCommunityPostBySlug,
  type CommunityDetailComment,
  type CommunityDetailCommentAction,
  type CommunityDetailCommentThread,
} from '../data/communityPostDetail';

/** Figma `like 24x24` — 기본(미선택) */
function LikeGlyph24Outline() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path
        d="M12 20.1 4.6 13.2C3.26 11.98 3.04 10.13 3.94 8.68 4.82 7.27 6.64 6.92 8.04 7.7L12 10.2 15.96 7.7c1.4-.78 3.22-.43 4.1.98.9 1.45.68 3.3-.66 4.52L12 20.1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Figma 6406:63865 `like on 24x24` — 채운 하트 */
function LikeGlyph24On() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path
        className="community-post-detail__like-fill"
        d="M12 20.1 4.6 13.2C3.26 11.98 3.04 10.13 3.94 8.68 4.82 7.27 6.64 6.92 8.04 7.7L12 10.2 15.96 7.7c1.4-.78 3.22-.43 4.1.98.9 1.45.68 3.3-.66 4.52L12 20.1Z"
      />
    </svg>
  );
}

function CommentGlyph24() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path
        d="M5.2 5.2h13.6v7.2h-6.26l-3.06 2.6v-2.6H5.2V5.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function SendGlyph24() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path
        d="M4.4 12.2 19.2 5.4c.5-.2.8.4.4.8l-6.3 12.4c-.2.4-.8.4-1-.1l-1.9-5.7-5.1-1.6c-.5-.1-.6-.8-.1-1z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

/** Figma post detail — siren / alert entry for 게시글 신고 */
function SirenGlyph30() {
  return (
    <svg aria-hidden="true" fill="none" height="30" viewBox="0 0 30 30" width="30">
      <path
        d="M15 4v3M15 23v3M7.2 7.2l2.1 2.1M20.7 20.7l2.1 2.1M5 15h3M22 15h3M7.2 22.8l2.1-2.1M20.7 9.3l2.1-2.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M11.5 15a3.5 3.5 0 0 0 7 0 3.5 3.5 0 0 0-7 0Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path d="M12 21h6l-.6 2.3a1 1 0 0 1-1 .7h-2.8a1 1 0 0 1-1-.7L12 21Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.3" />
    </svg>
  );
}

function AuthorChevron16() {
  return (
    <span className="community-post-detail__author-chevron" aria-hidden>
      <svg fill="none" viewBox="0 0 10 10">
        <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

function actionLabel(action: CommunityDetailCommentAction): string {
  if (action === 'reply') return '답글 달기';
  if (action === 'report') return '신고하기';
  return '답글 삭제';
}

function CommentMeta({
  time,
  actions,
  onActionClick,
}: {
  time: string;
  actions: CommunityDetailCommentAction[];
  onActionClick?: (action: CommunityDetailCommentAction) => void;
}) {
  const nodes: ReactNode[] = [];
  nodes.push(<span key="t">{time}</span>);
  for (let i = 0; i < actions.length; i += 1) {
    const a = actions[i];
    nodes.push(<span className="community-post-detail__meta-dot" key={`d-${i}`} />);
    nodes.push(
      <button key={`action-${i}-${a}`} onClick={() => onActionClick?.(a)} type="button">
        {actionLabel(a)}
      </button>,
    );
  }
  return <div className="community-post-detail__comment-meta">{nodes}</div>;
}

function CommentContent({ comment }: { comment: CommunityDetailComment }) {
  const paras = comment.body.split('\n').filter(Boolean);
  if (comment.mention) {
    return (
      <div className="community-post-detail__comment-text">
        {paras.map((line, i) => (
          <p key={`${line}-${i}`}>
            {i === 0 ? (
              <>
                <span className="community-post-detail__mention">@{comment.mention}</span>{' '}
                {line}
              </>
            ) : (
              line
            )}
          </p>
        ))}
      </div>
    );
  }
  return (
    <div className="community-post-detail__comment-text">
      {paras.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function CommentBlock({
  comment,
  onCommentAction,
}: {
  comment: CommunityDetailComment;
  onCommentAction?: (action: CommunityDetailCommentAction) => void;
}) {
  return (
    <div className="community-post-detail__comment-row">
      <img alt="" className="community-post-detail__comment-avatar" height="34" src={comment.avatar} width="34" />
      <div className="community-post-detail__comment-body">
        <div className="community-post-detail__comment-author">
          {comment.author}
          {comment.authorNote ? <> {comment.authorNote}</> : null}
        </div>
        <CommentContent comment={comment} />
        <CommentMeta actions={comment.actions} onActionClick={onCommentAction} time={comment.time} />
      </div>
    </div>
  );
}

function CommentThreadView({
  thread,
  onCommentAction,
}: {
  thread: CommunityDetailCommentThread;
  onCommentAction?: (commentId: string, action: CommunityDetailCommentAction) => void;
}) {
  return (
    <div className="community-post-detail__comment-block">
      <CommentBlock comment={thread.root} onCommentAction={(a) => onCommentAction?.(thread.root.id, a)} />
      {thread.replies.length > 0 ? (
        <div className="community-post-detail__replies">
          {thread.replies.map((r) => (
            <CommentBlock
              comment={r}
              key={r.id}
              onCommentAction={(a) => onCommentAction?.(r.id, a)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommunityPostDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const isAuthenticated = Boolean(loadAuthSession());

  // Mock mode: use static data; API mode: fetch from backend
  const mockPost = isMockMode() ? getCommunityPostBySlug(slug) : null;
  const [apiPost, setApiPost] = useState<PostDetailDto | null>(null);
  const [apiComments, setApiComments] = useState<CommentTreeDto[]>([]);
  const [apiLoading, setApiLoading] = useState(!isMockMode());

  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentThreads, setCommentThreads] = useState<CommunityDetailCommentThread[]>([]);
  const [visibleCommentCount, setVisibleCommentCount] = useState(0);
  const [replyDeleteId, setReplyDeleteId] = useState<string | null>(null);
  const [postReportConfirmOpen, setPostReportConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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
      if (!headerSearchRef.current?.contains(target)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (isMockMode()) {
      if (!slug || !getCommunityPostBySlug(slug)) {
        navigate('/community', { replace: true });
      }
      return;
    }
    if (!slug) {
      navigate('/community', { replace: true });
      return;
    }
    setApiLoading(true);
    Promise.all([fetchPostDetail(slug), fetchPostComments(slug)])
      .then(([data, comments]) => {
        setApiPost(data);
        setLikesCount(data.likeCount);
        setVisibleCommentCount(data.commentCount);
        setApiComments(comments);
      })
      .catch(() => {
        navigate('/community', { replace: true });
      })
      .finally(() => {
        setApiLoading(false);
      });
  }, [slug, navigate]);

  useEffect(() => {
    if (!mockPost) return;
    setLiked(mockPost.likedByViewer ?? false);
    setLikesCount(mockPost.likes);
    setCommentThreads(
      mockPost.commentThreads.map((t) => ({
        root: { ...t.root },
        replies: t.replies.map((r) => ({ ...r })),
      })),
    );
    setVisibleCommentCount(mockPost.commentCount);
  }, [mockPost]);

  const toggleLike = useCallback(() => {
    setLiked((v) => {
      setLikesCount((c) => (v ? c - 1 : c + 1));
      return !v;
    });
  }, []);

  const handleCommentAction = useCallback((commentId: string, action: CommunityDetailCommentAction) => {
    if (action === 'delete') setReplyDeleteId(commentId);
    if (action === 'report') setReportOpen(true);
  }, []);

  const confirmPostReport = useCallback(() => {
    setPostReportConfirmOpen(false);
    setReportOpen(true);
  }, []);

  const cancelPostReportConfirm = useCallback(() => setPostReportConfirmOpen(false), []);

  const confirmReplyDelete = useCallback(() => {
    if (!replyDeleteId) return;
    setCommentThreads((prev) =>
      prev.map((t) => ({
        ...t,
        replies: t.replies.filter((r) => r.id !== replyDeleteId),
      })),
    );
    setVisibleCommentCount((c) => Math.max(0, c - 1));
    setReplyDeleteId(null);
  }, [replyDeleteId]);

  const cancelReplyDelete = useCallback(() => setReplyDeleteId(null), []);

  if (isMockMode() && !mockPost) {
    return null;
  }

  if (!isMockMode() && apiLoading) {
    return (
      <main className="community-post-detail">
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
        <div className="community-post-detail__main" />
        <HomeFooter />
      </main>
    );
  }

  if (!isMockMode() && !apiPost) {
    return null;
  }

  // Derived display values — mock path uses mockPost, API path uses apiPost
  const displayTitle = isMockMode() ? (mockPost!.title) : (apiPost!.title);
  const displayAuthor = isMockMode() ? (mockPost!.author) : `사용자 ${apiPost!.authorUserId}`;
  const displayAuthorAvatar = isMockMode() ? (mockPost!.authorAvatar) : '';
  const displayPostedAt = isMockMode()
    ? (mockPost!.postedAt)
    : new Date(apiPost!.createdAt).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      });
  const displayCategoryLabel = isMockMode() ? (mockPost!.categoryLabel) : '';

  const displayCommentThreads: import('../data/communityPostDetail').CommunityDetailCommentThread[] = isMockMode()
    ? commentThreads
    : apiComments.map((tree) => ({
        root: {
          id: String(tree.comment.commentId),
          author: `사용자 ${tree.comment.authorUserId}`,
          avatar: '',
          time: new Date(tree.comment.createdAt).toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
          }),
          body: tree.comment.content,
          actions: ['reply', 'report'] as import('../data/communityPostDetail').CommunityDetailCommentAction[],
        },
        replies: tree.replies.map((r) => ({
          id: String(r.commentId),
          author: `사용자 ${r.authorUserId}`,
          avatar: '',
          time: new Date(r.createdAt).toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
          }),
          body: r.content,
          actions: ['reply', 'report'] as import('../data/communityPostDetail').CommunityDetailCommentAction[],
        })),
      }));

  return (
    <main className="community-post-detail">
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

      <div className="community-post-detail__main">
        <div className="community-post-detail__layout">
          <article className="community-post-detail__article">
            <div>
              <div className="community-post-detail__post-head">
                <div className="community-post-detail__title-block">
                  {displayCategoryLabel ? (
                    <span className="community-post-detail__category">{displayCategoryLabel}</span>
                  ) : null}
                  <h1 className="community-post-detail__title">{displayTitle}</h1>
                </div>
                <button
                  aria-label="게시글 신고"
                  className="community-post-detail__subscribe"
                  onClick={() => setPostReportConfirmOpen(true)}
                  type="button"
                >
                  <SirenGlyph30 />
                </button>
              </div>

              <div className="community-post-detail__author-row">
                {displayAuthorAvatar ? (
                  <img
                    alt=""
                    className="community-post-detail__author-avatar"
                    height="40"
                    src={displayAuthorAvatar}
                    width="40"
                  />
                ) : (
                  <div className="community-post-detail__author-avatar" style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0e0e0' }} />
                )}
                <div className="community-post-detail__author-meta">
                  <div className="community-post-detail__author-name-row">
                    <span className="community-post-detail__author-name">{displayAuthor}</span>
                    <AuthorChevron16 />
                  </div>
                  <span className="community-post-detail__author-time">{displayPostedAt}</span>
                </div>
              </div>

              {isMockMode() ? (
                <p className="community-post-detail__body">{mockPost!.body}</p>
              ) : (
                <div className="community-post-detail__body">
                  {apiPost!.blocks
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((block, idx) => {
                      if (block.blockType === 'IMAGE') {
                        return (
                          <img
                            alt=""
                            className="community-post-detail__block-image"
                            key={block.blockId ?? idx}
                            src={block.content}
                          />
                        );
                      }
                      return (
                        <p key={block.blockId ?? idx}>{block.content}</p>
                      );
                    })}
                </div>
              )}
            </div>

            {isMockMode() ? (
              <div className="community-post-detail__hero">
                <img alt="" height="400" src={mockPost!.heroImage} width="1200" />
              </div>
            ) : null}

            <div className="community-post-detail__stats">
              <button
                aria-label={liked ? '좋아요 취소' : '좋아요'}
                aria-pressed={liked}
                className="community-post-detail__stat"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate(`/login?returnTo=${encodeURIComponent(`/community/post/${slug}`)}`);
                    return;
                  }
                  toggleLike();
                }}
                type="button"
              >
                {liked ? <LikeGlyph24On /> : <LikeGlyph24Outline />}
                <span>{likesCount}</span>
              </button>
              <div className="community-post-detail__stat">
                <CommentGlyph24 />
                <span>{visibleCommentCount}</span>
              </div>
            </div>

            <div className="community-post-detail__nav-block">
              {isMockMode() && mockPost ? (
                <div className="community-post-detail__adjacent">
                  <div className="community-post-detail__adjacent-row">
                    <span className="community-post-detail__adjacent-label">이전으로</span>
                    <div className="community-post-detail__adjacent-body">
                      <p className="community-post-detail__adjacent-title">{mockPost.adjacent.prev.title}</p>
                      <span className="community-post-detail__adjacent-date">{mockPost.adjacent.prev.date}</span>
                    </div>
                  </div>
                  <div className="community-post-detail__adjacent-row">
                    <span className="community-post-detail__adjacent-label">다음으로</span>
                    <div className="community-post-detail__adjacent-body">
                      <p className="community-post-detail__adjacent-title">{mockPost.adjacent.next.title}</p>
                      <span className="community-post-detail__adjacent-date">{mockPost.adjacent.next.date}</span>
                    </div>
                  </div>
                </div>
              ) : null}
              <Link className="community-post-detail__back" to="/community">
                목록으로
              </Link>
            </div>
          </article>

          <aside className="community-post-detail__sidebar">
            <div className="community-post-detail__comments-card">
              <div>
                <h2 className="community-post-detail__comments-head">댓글 {visibleCommentCount}</h2>
                <div className="community-post-detail__comments-scroll">
                  {displayCommentThreads.map((thread) => (
                    <CommentThreadView
                      key={thread.root.id}
                      onCommentAction={handleCommentAction}
                      thread={thread}
                    />
                  ))}
                </div>
              </div>
              <div className="community-post-detail__comment-input-wrap">
                {isAuthenticated ? (
                  <>
                    <input
                      className="community-post-detail__comment-input"
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="댓글을 입력해주세요."
                      type="text"
                      value={draft}
                    />
                    <button aria-label="댓글 보내기" className="community-post-detail__comment-send" type="button">
                      <SendGlyph24 />
                    </button>
                  </>
                ) : (
                  <button
                    className="community-post-detail__comment-input community-post-detail__comment-login-prompt"
                    onClick={() => navigate(`/login?returnTo=${encodeURIComponent(`/community/post/${slug}`)}`)}
                    type="button"
                    style={{ cursor: 'pointer', textAlign: 'left', color: '#999', border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', background: '#fafafa', width: '100%' }}
                  >
                    댓글을 작성하려면 로그인해주세요.
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <HomeFooter />

      <CommunityReplyDeleteModal
        onCancel={cancelReplyDelete}
        onConfirm={confirmReplyDelete}
        open={replyDeleteId != null}
      />

      <CommunityPostReportConfirmModal
        onCancel={cancelPostReportConfirm}
        onConfirm={confirmPostReport}
        open={postReportConfirmOpen}
      />

      <CommunityReportModal onClose={() => setReportOpen(false)} open={reportOpen} />
    </main>
  );
}
