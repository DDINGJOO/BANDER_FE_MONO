import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  createCommunityComment,
  deleteCommunityComment,
  fetchCommunityPostComments,
  fetchCommunityPostDetail,
  toggleCommunityReaction,
  type CommunityAdjacentPostDto,
  type CommunityCommentDto,
  type CommunityCommentTreeDto,
  type CommunityPostBlockDto,
  type CommunityPostDetailDto,
} from '../api/community';
import { ApiError } from '../api/client';
import { CommunityPostReportConfirmModal } from '../components/community/CommunityPostReportConfirmModal';
import { CommunityReportModal } from '../components/community/CommunityReportModal';
import { CommunityReplyDeleteModal } from '../components/community/CommunityReplyDeleteModal';
import { HomeFooter } from '../components/home/HomeFooter';
import { HomeHeader } from '../components/home/HomeHeader';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { resolveProfileImageUrl } from '../config/media';
import { loadAuthSession } from '../data/authSession';
import type {
  CommunityDetailComment,
  CommunityDetailCommentAction,
  CommunityDetailCommentThread,
} from '../data/communityPostDetail';

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
      <path
        d="M12 21h6l-.6 2.3a1 1 0 0 1-1 .7h-2.8a1 1 0 0 1-1-.7L12 21Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function AuthorChevron16() {
  return (
    <span aria-hidden className="community-post-detail__author-chevron">
      <svg fill="none" viewBox="0 0 10 10">
        <path
          d="M2.5 3.75L5 6.25L7.5 3.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
    </span>
  );
}

function actionLabel(action: CommunityDetailCommentAction): string {
  if (action === 'reply') return '답글 달기';
  if (action === 'report') return '신고하기';
  return '삭제하기';
}

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
  if (!ref) {
    return undefined;
  }
  return resolveProfileImageUrl(ref) ?? ref;
}

function countComments(threads: CommunityCommentTreeDto[]) {
  return threads.reduce((sum, thread) => sum + 1 + thread.replies.length, 0);
}

function mapCommentActions(comment: CommunityCommentDto, currentUserId: string | null) {
  // 백엔드 MAX_DEPTH = 1 → depth ≥ 1 인 대댓글에는 답글 불가
  const canReply = comment.depth < 1;

  if (currentUserId && String(comment.authorUserId) === currentUserId) {
    return (canReply ? ['reply', 'delete'] : ['delete']) as CommunityDetailCommentAction[];
  }

  return (canReply ? ['reply', 'report'] : ['report']) as CommunityDetailCommentAction[];
}

function mapCommentToViewModel(
  comment: CommunityCommentDto,
  currentUserId: string | null
): CommunityDetailComment {
  const authorLabel =
    currentUserId && String(comment.authorUserId) === currentUserId
      ? `${comment.authorNickname ?? '밴더유저'}(나)`
      : comment.authorNickname ?? '밴더유저';

  return {
    actions: mapCommentActions(comment, currentUserId),
    author: authorLabel,
    avatar: resolveMediaUrl(comment.authorProfileImageRef) ?? '',
    body: comment.content,
    id: String(comment.commentId),
    time: formatDateLabel(comment.createdAt),
  };
}

function mapCommentThreads(
  threads: CommunityCommentTreeDto[],
  currentUserId: string | null
): CommunityDetailCommentThread[] {
  return threads.map((thread) => ({
    replies: thread.replies.map((reply) => mapCommentToViewModel(reply, currentUserId)),
    root: mapCommentToViewModel(thread.comment, currentUserId),
  }));
}

function resolveAdjacentPath(item: CommunityAdjacentPostDto | null | undefined) {
  if (!item) {
    return null;
  }

  const identifier = item.postId ?? item.slug;
  if (identifier === undefined || identifier === null || identifier === '') {
    return null;
  }

  return `/community/post/${identifier}`;
}

function CommentMeta({
  actions,
  onActionClick,
  time,
}: {
  actions: CommunityDetailCommentAction[];
  onActionClick?: (action: CommunityDetailCommentAction) => void;
  time: string;
}) {
  const nodes: ReactNode[] = [];
  nodes.push(<span key="t">{time}</span>);
  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    nodes.push(<span className="community-post-detail__meta-dot" key={`d-${i}`} />);
    nodes.push(
      <button key={`action-${i}-${action}`} onClick={() => onActionClick?.(action)} type="button">
        {actionLabel(action)}
      </button>
    );
  }
  return <div className="community-post-detail__comment-meta">{nodes}</div>;
}

function CommentContent({ comment }: { comment: CommunityDetailComment }) {
  const paragraphs = comment.body.split('\n').filter(Boolean);

  if (comment.mention) {
    return (
      <div className="community-post-detail__comment-text">
        {paragraphs.map((line, index) => (
          <p key={`${line}-${index}`}>
            {index === 0 ? (
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
      {paragraphs.map((line) => (
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
      {comment.avatar ? (
        <img
          alt=""
          className="community-post-detail__comment-avatar"
          height="34"
          src={comment.avatar}
          width="34"
        />
      ) : (
        <div
          className="community-post-detail__comment-avatar"
          style={{ background: '#e5eaf0' }}
        />
      )}
      <div className="community-post-detail__comment-body">
        <div className="community-post-detail__comment-author">
          {comment.author}
          {comment.authorNote ? <> {comment.authorNote}</> : null}
        </div>
        <CommentContent comment={comment} />
        <CommentMeta
          actions={comment.actions}
          onActionClick={onCommentAction}
          time={comment.time}
        />
      </div>
    </div>
  );
}

function CommentThreadView({
  onCommentAction,
  thread,
}: {
  onCommentAction?: (commentId: string, action: CommunityDetailCommentAction) => void;
  thread: CommunityDetailCommentThread;
}) {
  return (
    <div className="community-post-detail__comment-block">
      <CommentBlock
        comment={thread.root}
        onCommentAction={(action) => onCommentAction?.(thread.root.id, action)}
      />
      {thread.replies.length > 0 ? (
        <div className="community-post-detail__replies">
          {thread.replies.map((reply) => (
            <CommentBlock
              comment={reply}
              key={reply.id}
              onCommentAction={(action) => onCommentAction?.(reply.id, action)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function renderPostBlocks(blocks: CommunityPostBlockDto[]) {
  return blocks
    .slice()
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((block, index) => {
      const key = block.blockId ?? `${block.blockType}-${index}`;

      if (block.blockType === 'IMAGE') {
        const src = resolveMediaUrl(block.content) ?? block.content;
        return (
          <img
            alt=""
            className="community-post-detail__block-image"
            key={key}
            src={src}
          />
        );
      }

      if (block.blockType === 'CODE') {
        return (
          <pre className="community-post-detail__body" key={key}>
            <code>{block.content}</code>
          </pre>
        );
      }

      return <p key={key} style={{ whiteSpace: 'pre-wrap' }}>{block.content}</p>;
    });
}

export function CommunityPostDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: postId } = useParams<{ slug: string }>();
  const authSession = loadAuthSession();
  const isAuthenticated = Boolean(authSession);
  const currentUserId = authSession ? String(authSession.userId) : null;

  const [post, setPost] = useState<CommunityPostDetailDto | null>(null);
  const [commentTrees, setCommentTrees] = useState<CommunityCommentTreeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionError, setActionError] = useState('');

  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const headerSearchRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [replyDeleteId, setReplyDeleteId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{
    author: string;
    body: string;
    commentId: string;
  } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const likeInFlight = useRef(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const [postReportConfirmOpen, setPostReportConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const loadComments = useCallback(async (targetPostId: string) => {
    const nextComments = await fetchCommunityPostComments(targetPostId);
    setCommentTrees(nextComments);
    return nextComments;
  }, []);

  const loadPost = useCallback(async () => {
    if (!postId) {
      navigate('/community', { replace: true });
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const [nextPost, nextComments] = await Promise.all([
        fetchCommunityPostDetail(postId),
        fetchCommunityPostComments(postId),
      ]);
      setPost(nextPost);
      setLiked(Boolean(nextPost.likedByViewer));
      setLikesCount(nextPost.likeCount);
      setCommentTrees(nextComments);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
        return;
      }
      setErrorMessage(getErrorMessage(error, '게시글을 불러오지 못했습니다.'));
      setPost(null);
      setCommentTrees([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, postId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

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

  const commentThreads = useMemo(
    () => mapCommentThreads(commentTrees, currentUserId),
    [commentTrees, currentUserId]
  );

  const visibleCommentCount = countComments(commentTrees);
  const previousPost = post?.adjacent?.prev ?? null;
  const nextPost = post?.adjacent?.next ?? null;

  const toggleLike = useCallback(async () => {
    if (!postId || likeInFlight.current) {
      return;
    }

    likeInFlight.current = true;
    setActionError('');

    try {
      const response = await toggleCommunityReaction(postId);
      setLiked(response.liked);
      // 낙관적 업데이트: 서버 응답에 likeCount가 없어 현재 카운트 기반으로 계산.
      // 동시 요청 시 서버와 불일치 가능 - 실제 likeCount는 페이지 재조회 시 동기화됨.
      setLikesCount((current) =>
        response.liked ? current + 1 : Math.max(0, current - 1)
      );
    } catch (error) {
      setActionError(getErrorMessage(error, '좋아요 처리에 실패했습니다.'));
    } finally {
      likeInFlight.current = false;
    }
  }, [postId]);

  const handleSubmitComment = useCallback(async () => {
    if (!postId || !draft.trim() || submittingComment) {
      return;
    }

    setSubmittingComment(true);
    setActionError('');

    try {
      await createCommunityComment(postId, {
        content: draft.trim(),
        parentId: replyTo ? Number(replyTo.commentId) : undefined,
      });
      const nextComments = await loadComments(postId);
      setDraft('');
      setReplyTo(null);
      if (post) {
        setPost({ ...post, commentCount: countComments(nextComments) });
      }
    } catch (error) {
      setActionError(getErrorMessage(error, '댓글 등록에 실패했습니다.'));
    } finally {
      setSubmittingComment(false);
    }
  }, [draft, loadComments, post, postId, replyTo, submittingComment]);

  const handleCommentAction = useCallback(
    (commentId: string, action: CommunityDetailCommentAction) => {
      if (action === 'delete') {
        setReplyDeleteId(commentId);
        return;
      }

      if (action === 'report') {
        setReportOpen(true);
        return;
      }

      for (const thread of commentTrees) {
        if (String(thread.comment.commentId) === commentId) {
          setReplyTo({
            author: thread.comment.authorNickname ?? '밴더유저',
            body: thread.comment.content,
            commentId,
          });
          commentInputRef.current?.focus();
          return;
        }

        const reply = thread.replies.find(
          (candidate) => String(candidate.commentId) === commentId
        );
        if (reply) {
          setReplyTo({
            author: reply.authorNickname ?? '밴더유저',
            body: reply.content,
            commentId,
          });
          commentInputRef.current?.focus();
          return;
        }
      }
    },
    [commentTrees]
  );

  const confirmPostReport = useCallback(() => {
    setPostReportConfirmOpen(false);
    setReportOpen(true);
  }, []);

  const cancelPostReportConfirm = useCallback(() => {
    setPostReportConfirmOpen(false);
  }, []);

  const confirmReplyDelete = useCallback(async () => {
    if (!postId || !replyDeleteId) {
      return;
    }

    setActionError('');

    try {
      const deletingReplyTo =
        replyTo && replyTo.commentId === replyDeleteId ? replyTo : null;
      await deleteCommunityComment(postId, replyDeleteId);
      const nextComments = await loadComments(postId);
      if (post) {
        setPost({ ...post, commentCount: countComments(nextComments) });
      }
      if (deletingReplyTo) {
        setReplyTo(null);
      }
      setReplyDeleteId(null);
    } catch (error) {
      setActionError(getErrorMessage(error, '댓글 삭제에 실패했습니다.'));
      setReplyDeleteId(null);
    }
  }, [loadComments, post, postId, replyDeleteId, replyTo]);

  const cancelReplyDelete = useCallback(() => {
    setReplyDeleteId(null);
  }, []);

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
        {loading ? (
          <div className="community-post-detail__layout">
            <article className="community-post-detail__article">
              <p className="community-post-detail__body">게시글을 불러오는 중입니다.</p>
            </article>
          </div>
        ) : errorMessage || !post ? (
          <div className="community-post-detail__layout">
            <article className="community-post-detail__article">
              <p className="community-post-detail__body">{errorMessage}</p>
              <Link className="community-post-detail__back" to="/community">
                목록으로
              </Link>
            </article>
          </div>
        ) : (
          <div className="community-post-detail__layout">
            <article className="community-post-detail__article">
              <div>
                <div className="community-post-detail__post-head">
                  <div className="community-post-detail__title-block">
                    {post.categoryLabel ? (
                      <span className="community-post-detail__category">
                        {post.categoryLabel}
                      </span>
                    ) : null}
                    <h1 className="community-post-detail__title">{post.title}</h1>
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
                  {resolveMediaUrl(post.authorProfileImageRef) ? (
                    <img
                      alt=""
                      className="community-post-detail__author-avatar"
                      height="40"
                      src={resolveMediaUrl(post.authorProfileImageRef)}
                      width="40"
                    />
                  ) : (
                    <div
                      className="community-post-detail__author-avatar"
                      style={{
                        background: '#e0e0e0',
                        borderRadius: '50%',
                        height: 40,
                        width: 40,
                      }}
                    />
                  )}
                  <div className="community-post-detail__author-meta">
                    <div className="community-post-detail__author-name-row">
                      <span className="community-post-detail__author-name">
                        {post.authorNickname ?? '밴더유저'}
                      </span>
                      <AuthorChevron16 />
                    </div>
                    <span className="community-post-detail__author-time">
                      {formatDateLabel(post.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="community-post-detail__body">
                  {renderPostBlocks(post.blocks)}
                </div>
              </div>

              <div className="community-post-detail__stats">
                <button
                  aria-label={liked ? '좋아요 취소' : '좋아요'}
                  aria-pressed={liked}
                  className="community-post-detail__stat"
                  disabled={likeInFlight.current}
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate(
                        `/login?returnTo=${encodeURIComponent(`/community/post/${postId}`)}`
                      );
                      return;
                    }
                    void toggleLike();
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

              {actionError ? (
                <p
                  className="community-post-detail__body"
                  role="status"
                  style={{ color: '#d14b4b', fontSize: 14, marginTop: -12 }}
                >
                  {actionError}
                </p>
              ) : null}

              <div className="community-post-detail__nav-block">
                {previousPost || nextPost ? (
                  <div className="community-post-detail__adjacent">
                    {previousPost ? (
                      <div className="community-post-detail__adjacent-row">
                        <span className="community-post-detail__adjacent-label">이전으로</span>
                        <div className="community-post-detail__adjacent-body">
                          {resolveAdjacentPath(previousPost) ? (
                            <Link
                              className="community-post-detail__adjacent-title"
                              to={resolveAdjacentPath(previousPost) ?? '/community'}
                            >
                              {previousPost.title}
                            </Link>
                          ) : (
                            <p className="community-post-detail__adjacent-title">
                              {previousPost.title}
                            </p>
                          )}
                          <span className="community-post-detail__adjacent-date">
                            {previousPost.date ?? formatDateLabel(previousPost.createdAt)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {nextPost ? (
                      <div className="community-post-detail__adjacent-row">
                        <span className="community-post-detail__adjacent-label">다음으로</span>
                        <div className="community-post-detail__adjacent-body">
                          {resolveAdjacentPath(nextPost) ? (
                            <Link
                              className="community-post-detail__adjacent-title"
                              to={resolveAdjacentPath(nextPost) ?? '/community'}
                            >
                              {nextPost.title}
                            </Link>
                          ) : (
                            <p className="community-post-detail__adjacent-title">
                              {nextPost.title}
                            </p>
                          )}
                          <span className="community-post-detail__adjacent-date">
                            {nextPost.date ?? formatDateLabel(nextPost.createdAt)}
                          </span>
                        </div>
                      </div>
                    ) : null}
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
                  <h2 className="community-post-detail__comments-head">
                    댓글 {visibleCommentCount}
                  </h2>
                  <div className="community-post-detail__comments-scroll">
                    {commentThreads.length > 0 ? (
                      commentThreads.map((thread) => (
                        <CommentThreadView
                          key={thread.root.id}
                          onCommentAction={handleCommentAction}
                          thread={thread}
                        />
                      ))
                    ) : (
                      <p
                        className="community-post-detail__body"
                        style={{ color: '#6d7a87', fontSize: 14 }}
                      >
                        등록된 댓글이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
                <div className="community-post-detail__comment-input-wrap">
                  {replyTo ? (
                    <div className="community-post-detail__reply-preview">
                      <div className="community-post-detail__reply-preview-bubble">
                        <span className="community-post-detail__reply-preview-author">
                          {replyTo.author}
                        </span>
                        <span className="community-post-detail__reply-preview-body">
                          {replyTo.body.length > 60
                            ? `${replyTo.body.slice(0, 60)}...`
                            : replyTo.body}
                        </span>
                      </div>
                      <button
                        aria-label="답글 취소"
                        className="community-post-detail__reply-preview-close"
                        onClick={() => setReplyTo(null)}
                        type="button"
                      >
                        &times;
                      </button>
                    </div>
                  ) : null}
                  {isAuthenticated ? (
                    <>
                      <input
                        className="community-post-detail__comment-input"
                        disabled={submittingComment}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (
                            event.key === 'Enter' &&
                            !event.nativeEvent.isComposing
                          ) {
                            void handleSubmitComment();
                          }
                        }}
                        placeholder={
                          replyTo
                            ? `${replyTo.author}에게 답글...`
                            : '댓글을 입력해주세요.'
                        }
                        ref={commentInputRef}
                        type="text"
                        value={draft}
                      />
                      <button
                        aria-label="댓글 보내기"
                        className="community-post-detail__comment-send"
                        disabled={submittingComment}
                        onClick={() => void handleSubmitComment()}
                        type="button"
                      >
                        <SendGlyph24 />
                      </button>
                    </>
                  ) : (
                    <button
                      className="community-post-detail__comment-input community-post-detail__comment-login-prompt"
                      onClick={() =>
                        navigate(
                          `/login?returnTo=${encodeURIComponent(
                            `/community/post/${postId}`
                          )}`
                        )
                      }
                      style={{
                        background: '#fafafa',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        color: '#999',
                        cursor: 'pointer',
                        padding: '10px 14px',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      type="button"
                    >
                      댓글을 작성하려면 로그인해주세요.
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <HomeFooter />

      <CommunityReplyDeleteModal
        onCancel={cancelReplyDelete}
        onConfirm={() => void confirmReplyDelete()}
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
