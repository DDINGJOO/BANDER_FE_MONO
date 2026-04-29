import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
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
import { useGuestGate } from '../components/home/GuestGateProvider';
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from '../config/searchSuggestions';
import { resolveProfileImageUrl } from '../config/media';
import { loadAuthSession } from '../data/authSession';
import type {
  CommunityDetailComment,
  CommunityDetailCommentAction,
  CommunityDetailCommentThread,
} from '../data/communityPostDetail';
import { ReactComponent as LikeOutlineSvg } from '../assets/icons/mobile/mobile-like-24x24.svg';
import { ReactComponent as LikeOnSvg } from '../assets/icons/mobile/mobile-like-on-24x24.svg';
import { ReactComponent as CommentSvg } from '../assets/icons/mobile/mobile-comment-24x24.svg';
import { ReactComponent as SendSvg } from '../assets/icons/mobile/mobile-send.svg';
import { ReactComponent as SirenSvg } from '../assets/icons/mobile/mobile-siren.svg';

function LikeGlyph24Outline() {
  return <LikeOutlineSvg aria-hidden="true" />;
}

function LikeGlyph24On() {
  return <LikeOnSvg aria-hidden="true" className="community-post-detail__like-fill" />;
}

function CommentGlyph24() {
  return <CommentSvg aria-hidden="true" />;
}

function SendGlyph24() {
  return <SendSvg aria-hidden="true" />;
}

function SirenGlyph30() {
  return <SirenSvg aria-hidden="true" />;
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

function resolveMediaUrl(
  ref: string | null | undefined,
  url?: string | null,
) {
  // R2-B: prefer denormalized profile image URL (UserProfileUpdated fanout) when
  // present; fall back to ref-based reconstruction for legacy rows.
  return resolveProfileImageUrl(ref, url);
}

function countComments(threads: CommunityCommentTreeDto[]) {
  // tombstone(deleted=true) 부모는 백엔드 Post.commentCount 에서 이미 차감되어 있으므로
  // FE 클라이언트 카운트에서도 제외해야 백엔드 값과 일치한다.
  return threads.reduce(
    (sum, thread) => sum + (thread.comment.deleted ? 0 : 1) + thread.replies.length,
    0
  );
}

function mapCommentActions(comment: CommunityCommentDto, currentUserId: string | null) {
  // 삭제된(tombstone) 댓글은 답글/신고/삭제 모두 불가
  if (comment.deleted) {
    return [] as CommunityDetailCommentAction[];
  }

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
  if (comment.deleted) {
    return {
      actions: [],
      author: '',
      avatar: '',
      body: '삭제된 댓글입니다',
      id: String(comment.commentId),
      time: formatDateLabel(comment.createdAt),
    };
  }

  const authorLabel =
    currentUserId && String(comment.authorUserId) === currentUserId
      ? `${comment.authorNickname ?? '밴더유저'}(나)`
      : comment.authorNickname ?? '밴더유저';

  return {
    actions: mapCommentActions(comment, currentUserId),
    author: authorLabel,
    authorUserId: String(comment.authorUserId),
    avatar:
      resolveMediaUrl(comment.authorProfileImageRef, comment.authorProfileImageUrl) ?? '',
    body: comment.content ?? '',
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

function resolveUserMiniFeedPath(userId: string | number | null | undefined) {
  if (userId === undefined || userId === null) {
    return null;
  }

  const normalized = String(userId).trim();
  return normalized ? `/users/${encodeURIComponent(normalized)}/minifeed` : null;
}

function resolveCommentsWindowPosition() {
  if (typeof window === 'undefined') {
    return { x: 24, y: 96 };
  }

  const width = Math.min(420, window.innerWidth - 32);
  const height = Math.min(620, window.innerHeight * 0.72);
  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(72, Math.round((window.innerHeight - height) / 2)),
  };
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
  onAuthorClick,
  onCommentAction,
}: {
  comment: CommunityDetailComment;
  onAuthorClick?: (userId: string) => void;
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
          {comment.authorUserId ? (
            <button
              className="community-post-detail__comment-author-button"
              onClick={() => onAuthorClick?.(comment.authorUserId ?? '')}
              type="button"
            >
              {comment.author}
            </button>
          ) : (
            comment.author
          )}
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
  onAuthorClick,
  onCommentAction,
  thread,
}: {
  onAuthorClick?: (userId: string) => void;
  onCommentAction?: (commentId: string, action: CommunityDetailCommentAction) => void;
  thread: CommunityDetailCommentThread;
}) {
  return (
    <div className="community-post-detail__comment-block">
      <CommentBlock
        comment={thread.root}
        onAuthorClick={onAuthorClick}
        onCommentAction={(action) => onCommentAction?.(thread.root.id, action)}
      />
      {thread.replies.length > 0 ? (
        <div className="community-post-detail__replies">
          {thread.replies.map((reply) => (
            <CommentBlock
              comment={reply}
              key={reply.id}
              onAuthorClick={onAuthorClick}
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
        // R1-G: prefer the denormalized CDN URL persisted on the block when
        // present; fall back to ref-based resolution for legacy IMAGE rows
        // that pre-date V7 (column NULL in DB).
        const src =
          resolveProfileImageUrl(block.content, block.imageUrl) ?? block.content;
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
  const { openGuestGate } = useGuestGate();
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
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
  const [commentsWindowPosition, setCommentsWindowPosition] = useState(() =>
    resolveCommentsWindowPosition()
  );
  const likeInFlight = useRef(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const commentsWindowRef = useRef<HTMLElement | null>(null);
  const commentsWindowDragRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [postReportConfirmOpen, setPostReportConfirmOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [authorMenuOpen, setAuthorMenuOpen] = useState(false);
  const authorMenuRef = useRef<HTMLDivElement | null>(null);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase())
  );

  const loadComments = useCallback(async (targetPostId: string) => {
    const nextComments = await fetchCommunityPostComments(targetPostId);
    setCommentTrees(nextComments);
    return nextComments;
  }, []);

  // Stale response 가드: 인접글 링크로 빠르게 이동할 때 이전 postId 의 응답이
  // 나중에 도착해서 새 postId 의 상태를 덮어쓰지 않도록 postId 별로 scope 검증.
  const activePostIdRef = useRef<string | undefined>(postId);

  const loadPost = useCallback(async () => {
    if (!postId) {
      navigate('/community', { replace: true });
      return;
    }

    activePostIdRef.current = postId;
    const requestedPostId = postId;
    setLoading(true);
    setErrorMessage('');

    try {
      const [nextPost, nextComments] = await Promise.all([
        fetchCommunityPostDetail(requestedPostId),
        fetchCommunityPostComments(requestedPostId),
      ]);
      // 이미 다른 postId 로 이동했다면 stale 응답 — 상태 덮어쓰기 중단.
      if (activePostIdRef.current !== requestedPostId) {
        return;
      }
      setPost(nextPost);
      setLiked(Boolean(nextPost.likedByViewer));
      setLikesCount(nextPost.likeCount);
      setCommentTrees(nextComments);
    } catch (error) {
      if (activePostIdRef.current !== requestedPostId) {
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        openGuestGate(location.pathname);
        return;
      }
      setErrorMessage(getErrorMessage(error, '게시글을 불러오지 못했습니다.'));
      setPost(null);
      setCommentTrees([]);
    } finally {
      if (activePostIdRef.current === requestedPostId) {
        setLoading(false);
      }
    }
  }, [location.pathname, navigate, openGuestGate, postId]);

  useEffect(() => {
    // postId 변경 시 이전 post 의 입력 컨텍스트를 초기화한다.
    // 이전 post 의 replyTo.commentId 가 다음 post 의 댓글 submit 에 실려
    // 잘못된 부모 id 로 mis-threaded reply 가 되는 버그를 방지.
    setReplyTo(null);
    setDraft('');
    setActionError('');
    setMobileCommentsOpen(false);
    void loadPost();
  }, [loadPost]);

  useEffect(() => {
    if (!mobileCommentsOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileCommentsOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileCommentsOpen]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const popupRange = window.matchMedia('(min-width: 768px) and (max-width: 1079px)');
    const closeOutsidePopupRange = () => {
      if (!popupRange.matches) {
        setMobileCommentsOpen(false);
      }
    };

    closeOutsidePopupRange();

    if (typeof popupRange.addEventListener === 'function') {
      popupRange.addEventListener('change', closeOutsidePopupRange);
      return () => popupRange.removeEventListener('change', closeOutsidePopupRange);
    }

    popupRange.addListener(closeOutsidePopupRange);
    return () => popupRange.removeListener(closeOutsidePopupRange);
  }, []);

  const clampCommentsWindowPosition = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined') {
      return { x, y };
    }

    const rect = commentsWindowRef.current?.getBoundingClientRect();
    const width = rect?.width ?? Math.min(420, window.innerWidth - 32);
    const height = rect?.height ?? Math.min(620, window.innerHeight * 0.72);
    const margin = 12;
    const headerAllowance = 56;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(headerAllowance, window.innerHeight - height - margin);

    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(headerAllowance, y), maxY),
    };
  }, []);

  useEffect(() => {
    if (!mobileCommentsOpen) {
      return undefined;
    }

    const handleResize = () => {
      setCommentsWindowPosition((position) =>
        clampCommentsWindowPosition(position.x, position.y)
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampCommentsWindowPosition, mobileCommentsOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!headerSearchRef.current?.contains(target)) {
        setHeaderSearchOpen(false);
      }
      if (!authorMenuRef.current?.contains(target)) {
        setAuthorMenuOpen(false);
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

  const navigateToUserMiniFeed = useCallback(
    (userId: string | number | null | undefined) => {
      const path = resolveUserMiniFeedPath(userId);
      if (path) {
        navigate(path);
      }
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
  const isOwnPost = Boolean(
    currentUserId && post && String(post.authorUserId) === currentUserId
  );
  const editPostPath = post
    ? `/community/post/${encodeURIComponent(String(post.postId ?? postId))}/edit`
    : null;

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
        // Snowflake ID 는 64bit 이므로 Number 변환 시 정밀도 손실 위험.
        // 문자열 그대로 전달한다.
        parentId: replyTo?.commentId ?? undefined,
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
            body: thread.comment.content ?? '',
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
            body: reply.content ?? '',
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

  const handleAuthorChatClick = useCallback(() => {
    setAuthorMenuOpen(false);
    navigate('/chat');
  }, [navigate]);

  const handleAuthorFeedClick = useCallback(() => {
    setAuthorMenuOpen(false);
    navigateToUserMiniFeed(post?.authorUserId);
  }, [navigateToUserMiniFeed, post?.authorUserId]);

  const handleAuthorReportClick = useCallback(() => {
    setAuthorMenuOpen(false);
    setPostReportConfirmOpen(true);
  }, []);

  const handleAuthorEditClick = useCallback(() => {
    if (!editPostPath) {
      return;
    }
    setAuthorMenuOpen(false);
    navigate(editPostPath);
  }, [editPostPath, navigate]);

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

  const openCommentsWindow = useCallback(() => {
    const nextPosition = resolveCommentsWindowPosition();
    setCommentsWindowPosition(nextPosition);
    setMobileCommentsOpen(true);
  }, []);

  const handleCommentsWindowDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      commentsWindowDragRef.current = {
        pointerId: event.pointerId,
        originX: commentsWindowPosition.x,
        originY: commentsWindowPosition.y,
        startX: event.clientX,
        startY: event.clientY,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [commentsWindowPosition]
  );

  const handleCommentsWindowDragMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = commentsWindowDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      const nextX = drag.originX + event.clientX - drag.startX;
      const nextY = drag.originY + event.clientY - drag.startY;
      setCommentsWindowPosition(clampCommentsWindowPosition(nextX, nextY));
    },
    [clampCommentsWindowPosition]
  );

  const handleCommentsWindowDragEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = commentsWindowDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      commentsWindowDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    []
  );

  const renderCommentsPanel = ({ showHeading = true } = {}) => (
    <div className="community-post-detail__comments-card">
      <div className="community-post-detail__comments-content">
        {showHeading ? (
          <h2 className="community-post-detail__comments-head">
            댓글 {visibleCommentCount}
          </h2>
        ) : null}
        <div className="community-post-detail__comments-scroll">
          {commentThreads.length > 0 ? (
            commentThreads.map((thread) => (
              <CommentThreadView
                key={thread.root.id}
                onAuthorClick={navigateToUserMiniFeed}
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
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  void handleSubmitComment();
                }
              }}
              placeholder={
                replyTo ? `${replyTo.author}에게 답글...` : '댓글을 입력해주세요.'
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
            onClick={() => openGuestGate(`/community/post/${postId}`)}
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
  );

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
                  {!isOwnPost ? (
                    <div className="community-post-detail__post-actions">
                      <button
                        aria-label="게시글 신고"
                        className="community-post-detail__subscribe"
                        onClick={() => setPostReportConfirmOpen(true)}
                        type="button"
                      >
                        <SirenGlyph30 />
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="community-post-detail__author-row">
                  {resolveMediaUrl(post.authorProfileImageRef, post.authorProfileImageUrl) ? (
                    <img
                      alt=""
                      className="community-post-detail__author-avatar"
                      height="40"
                      src={resolveMediaUrl(
                        post.authorProfileImageRef,
                        post.authorProfileImageUrl,
                      )}
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
                    <div
                      className="community-post-detail__author-menu-wrap"
                      ref={authorMenuRef}
                    >
                      <button
                        aria-expanded={authorMenuOpen}
                        aria-haspopup="menu"
                        className="community-post-detail__author-name-button"
                        onClick={() => setAuthorMenuOpen((current) => !current)}
                        type="button"
                      >
                        <span className="community-post-detail__author-name">
                          {post.authorNickname ?? '밴더유저'}
                        </span>
                        <AuthorChevron16 />
                      </button>
                      {authorMenuOpen ? (
                        <div className="community-post-detail__author-menu" role="menu">
                          {isOwnPost ? (
                            <button
                              onClick={handleAuthorEditClick}
                              role="menuitem"
                              type="button"
                            >
                              수정하기
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleAuthorChatClick}
                                role="menuitem"
                                type="button"
                              >
                                채팅하기
                              </button>
                              <button
                                onClick={handleAuthorFeedClick}
                                role="menuitem"
                                type="button"
                              >
                                피드보기
                              </button>
                              <button
                                onClick={handleAuthorReportClick}
                                role="menuitem"
                                type="button"
                              >
                                신고하기
                              </button>
                            </>
                          )}
                        </div>
                      ) : null}
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
                  className={`community-post-detail__stat${liked ? ' community-post-detail__stat--liked' : ''}`}
                  disabled={likeInFlight.current}
                  onClick={() => {
                    if (!isAuthenticated) {
                      openGuestGate(`/community/post/${postId}`);
                      return;
                    }
                    void toggleLike();
                  }}
                  type="button"
                >
                  {liked ? <LikeGlyph24On /> : <LikeGlyph24Outline />}
                  <span>{likesCount}</span>
                </button>
                <div className="community-post-detail__stat community-post-detail__stat--comment">
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
              {renderCommentsPanel()}
            </aside>
          </div>
        )}

        {!loading && !errorMessage && post ? (
          <button
            aria-controls="community-post-detail-comments-sheet"
            aria-expanded={mobileCommentsOpen}
            aria-label={`댓글 ${visibleCommentCount}개 보기`}
            className="community-post-detail__mobile-comment-fab"
            onClick={openCommentsWindow}
            type="button"
          >
            <CommentGlyph24 />
            <span>{visibleCommentCount}</span>
          </button>
        ) : null}
      </div>

      {!loading && !errorMessage && post && mobileCommentsOpen ? (
        <div
          className="community-post-detail__comments-sheet"
          role="presentation"
        >
          <section
            aria-labelledby="community-post-detail-comments-sheet-title"
            className="community-post-detail__comments-sheet-panel"
            id="community-post-detail-comments-sheet"
            ref={commentsWindowRef}
            role="dialog"
            style={{
              left: commentsWindowPosition.x,
              top: commentsWindowPosition.y,
            }}
          >
            <div className="community-post-detail__comments-sheet-head">
              <div
                className="community-post-detail__comments-sheet-drag"
                onPointerCancel={handleCommentsWindowDragEnd}
                onPointerDown={handleCommentsWindowDragStart}
                onPointerMove={handleCommentsWindowDragMove}
                onPointerUp={handleCommentsWindowDragEnd}
              >
                <span
                  aria-hidden="true"
                  className="community-post-detail__comments-sheet-handle"
                />
                <h2
                  className="community-post-detail__comments-sheet-title"
                  id="community-post-detail-comments-sheet-title"
                >
                  댓글 {visibleCommentCount}
                </h2>
              </div>
              <button
                aria-label="댓글 닫기"
                className="community-post-detail__comments-sheet-close"
                onClick={() => setMobileCommentsOpen(false)}
                type="button"
              >
                &times;
              </button>
            </div>
            {renderCommentsPanel({ showHeading: false })}
          </section>
        </div>
      ) : null}

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
