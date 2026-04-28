import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CommunityPostDetailPage } from '../CommunityPostDetailPage';
import * as communityApi from '../../api/community';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeFooter', () => ({
  HomeFooter: () => <div data-testid="home-footer" />,
}));

jest.mock('../../api/community', () => {
  const actual = jest.requireActual('../../api/community');
  return {
    ...actual,
    createCommunityComment: jest.fn(),
    deleteCommunityComment: jest.fn(),
    fetchCommunityPostComments: jest.fn(),
    fetchCommunityPostDetail: jest.fn(),
    toggleCommunityReaction: jest.fn(),
  };
});

const mockedFetchDetail = jest.mocked(communityApi.fetchCommunityPostDetail);
const mockedFetchComments = jest.mocked(communityApi.fetchCommunityPostComments);
const mockedCreateComment = jest.mocked(communityApi.createCommunityComment);
const mockedDeleteComment = jest.mocked(communityApi.deleteCommunityComment);
const mockedToggleReaction = jest.mocked(communityApi.toggleCommunityReaction);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/community/post/123']}>
      <Routes>
        <Route element={<CommunityPostDetailPage />} path="/community/post/:slug" />
        <Route element={<div>community list</div>} path="/community" />
        <Route element={<div>login page</div>} path="/login" />
        <Route element={<div>user feed</div>} path="/users/:userId/minifeed" />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.sessionStorage.setItem(
    'bander.authSession',
    JSON.stringify({
      expiresAt: '2026-04-11T00:00:00.000Z',
      gatewayContextToken: 'gateway-token',
      userId: 101,
    })
  );
});

test('loads post detail, toggles like, creates a comment, and deletes an owned comment', async () => {
  mockedFetchDetail.mockResolvedValue({
    authorNickname: '작성자',
    authorProfileImageRef: null,
    authorUserId: "999",
    blocks: [{ blockType: 'TEXT', content: '본문 내용', sortOrder: 0 }],
    commentCount: 2,
    createdAt: '2026-04-10T09:00:00.000Z',
    likeCount: 4,
    likedByViewer: false,
    postId: "123",
    status: 'PUBLISHED',
    title: '실 API 게시글 상세',
    updatedAt: '2026-04-10T09:00:00.000Z',
    viewCount: 10,
  });

  mockedFetchComments
    .mockResolvedValueOnce([
      {
        comment: {
          authorNickname: '다른 유저',
          authorProfileImageRef: null,
          authorUserId: "200",
          commentId: "1",
          content: '첫 댓글',
          createdAt: '2026-04-10T09:10:00.000Z',
          depth: 0,
          parentId: null,
          postId: "123",
        },
        replies: [
          {
            authorNickname: '내 닉네임',
            authorProfileImageRef: null,
            authorUserId: "101",
            commentId: "2",
            content: '내 답글',
            createdAt: '2026-04-10T09:11:00.000Z',
            depth: 1,
            parentId: "1",
            postId: "123",
          },
        ],
      },
    ])
    .mockResolvedValueOnce([
      {
        comment: {
          authorNickname: '다른 유저',
          authorProfileImageRef: null,
          authorUserId: "200",
          commentId: "1",
          content: '첫 댓글',
          createdAt: '2026-04-10T09:10:00.000Z',
          depth: 0,
          parentId: null,
          postId: "123",
        },
        replies: [
          {
            authorNickname: '내 닉네임',
            authorProfileImageRef: null,
            authorUserId: "101",
            commentId: "2",
            content: '내 답글',
            createdAt: '2026-04-10T09:11:00.000Z',
            depth: 1,
            parentId: "1",
            postId: "123",
          },
        ],
      },
      {
        comment: {
          authorNickname: '내 닉네임',
          authorProfileImageRef: null,
          authorUserId: "101",
          commentId: "3",
          content: '새 댓글',
          createdAt: '2026-04-10T09:12:00.000Z',
          depth: 0,
          parentId: null,
          postId: "123",
        },
        replies: [],
      },
    ])
    .mockResolvedValueOnce([
      {
        comment: {
          authorNickname: '다른 유저',
          authorProfileImageRef: null,
          authorUserId: "200",
          commentId: "1",
          content: '첫 댓글',
          createdAt: '2026-04-10T09:10:00.000Z',
          depth: 0,
          parentId: null,
          postId: "123",
        },
        replies: [],
      },
      {
        comment: {
          authorNickname: '내 닉네임',
          authorProfileImageRef: null,
          authorUserId: "101",
          commentId: "3",
          content: '새 댓글',
          createdAt: '2026-04-10T09:12:00.000Z',
          depth: 0,
          parentId: null,
          postId: "123",
        },
        replies: [],
      },
    ]);

  mockedToggleReaction.mockResolvedValue({ liked: true });
  mockedCreateComment.mockResolvedValue({
    authorNickname: '내 닉네임',
    authorProfileImageRef: null,
    authorUserId: "101",
    commentId: "3",
    content: '새 댓글',
    createdAt: '2026-04-10T09:12:00.000Z',
    depth: 0,
    parentId: null,
    postId: "123",
  });
  mockedDeleteComment.mockResolvedValue(undefined);

  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: '실 API 게시글 상세' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '댓글 2' })).toBeInTheDocument();
  expect(screen.queryByText('이전으로')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '좋아요' }));

  await waitFor(() => {
    expect(mockedToggleReaction).toHaveBeenCalledWith('123');
  });
  expect(await screen.findByRole('button', { name: '좋아요 취소' })).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('댓글을 입력해주세요.'), {
    target: { value: '새 댓글' },
  });
  fireEvent.click(screen.getByRole('button', { name: '댓글 보내기' }));

  await waitFor(() => {
    expect(mockedCreateComment).toHaveBeenCalledWith('123', { content: '새 댓글', parentId: undefined });
  });

  expect(await screen.findByText('내 닉네임(나)')).toBeInTheDocument();
  expect(screen.getByText('새 댓글')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '댓글 3' })).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: '삭제하기' })[0]);
  expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText('댓글 삭제')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '삭제' }));

  await waitFor(() => {
    expect(mockedDeleteComment).toHaveBeenCalledWith('123', '2');
  });

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: '댓글 2' })).toBeInTheDocument();
  });
  expect(screen.queryByText('내 답글')).not.toBeInTheDocument();
});

test('opens the post author menu and navigates to the author mini feed', async () => {
  mockedFetchDetail.mockResolvedValue({
    authorNickname: '작성자',
    authorProfileImageRef: null,
    authorUserId: "999",
    blocks: [{ blockType: 'TEXT', content: '본문 내용', sortOrder: 0 }],
    commentCount: 0,
    createdAt: '2026-04-10T09:00:00.000Z',
    likeCount: 4,
    likedByViewer: false,
    postId: "123",
    status: 'PUBLISHED',
    title: '실 API 게시글 상세',
    updatedAt: '2026-04-10T09:00:00.000Z',
    viewCount: 10,
  });
  mockedFetchComments.mockResolvedValue([]);

  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: '작성자' }));
  fireEvent.click(screen.getByRole('menuitem', { name: '피드보기' }));

  expect(await screen.findByText('user feed')).toBeInTheDocument();
});

test('navigates to a commenter mini feed from the comment nickname', async () => {
  mockedFetchDetail.mockResolvedValue({
    authorNickname: '작성자',
    authorProfileImageRef: null,
    authorUserId: "999",
    blocks: [{ blockType: 'TEXT', content: '본문 내용', sortOrder: 0 }],
    commentCount: 1,
    createdAt: '2026-04-10T09:00:00.000Z',
    likeCount: 4,
    likedByViewer: false,
    postId: "123",
    status: 'PUBLISHED',
    title: '실 API 게시글 상세',
    updatedAt: '2026-04-10T09:00:00.000Z',
    viewCount: 10,
  });
  mockedFetchComments.mockResolvedValue([
    {
      comment: {
        authorNickname: '다른 유저',
        authorProfileImageRef: null,
        authorUserId: "200",
        commentId: "1",
        content: '첫 댓글',
        createdAt: '2026-04-10T09:10:00.000Z',
        depth: 0,
        parentId: null,
        postId: "123",
      },
      replies: [],
    },
  ]);

  renderPage();

  fireEvent.click(await screen.findByRole('button', { name: '다른 유저' }));

  expect(await screen.findByText('user feed')).toBeInTheDocument();
});

test('opens and closes the responsive floating comments window from the marker', async () => {
  mockedFetchDetail.mockResolvedValue({
    authorNickname: '작성자',
    authorProfileImageRef: null,
    authorUserId: "999",
    blocks: [{ blockType: 'TEXT', content: '본문 내용', sortOrder: 0 }],
    commentCount: 1,
    createdAt: '2026-04-10T09:00:00.000Z',
    likeCount: 4,
    likedByViewer: false,
    postId: "123",
    status: 'PUBLISHED',
    title: '실 API 게시글 상세',
    updatedAt: '2026-04-10T09:00:00.000Z',
    viewCount: 10,
  });
  mockedFetchComments.mockResolvedValue([
    {
      comment: {
        authorNickname: '다른 유저',
        authorProfileImageRef: null,
        authorUserId: "200",
        commentId: "1",
        content: '첫 댓글',
        createdAt: '2026-04-10T09:10:00.000Z',
        depth: 0,
        parentId: null,
        postId: "123",
      },
      replies: [],
    },
  ]);

  renderPage();

  expect(await screen.findByRole('heading', { level: 1, name: '실 API 게시글 상세' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '댓글 1개 보기' }));

  const dialog = screen.getByRole('dialog', { name: '댓글 1' });
  expect(within(dialog).getByText('첫 댓글')).toBeInTheDocument();
  expect(dialog).not.toHaveAttribute('aria-modal');
  expect(document.querySelector('.community-post-detail__comments-sheet-backdrop')).not.toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: '댓글 닫기' }));

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

test('renders the liked heart when the detail response says the viewer liked the post', async () => {
  mockedFetchDetail.mockResolvedValue({
    authorNickname: '작성자',
    authorProfileImageRef: null,
    authorUserId: "999",
    blocks: [{ blockType: 'TEXT', content: '이미 좋아요한 글', sortOrder: 0 }],
    commentCount: 0,
    createdAt: '2026-04-10T09:00:00.000Z',
    likeCount: 12,
    likedByViewer: true,
    postId: "123",
    status: 'PUBLISHED',
    title: '좋아요 상태 게시글',
    updatedAt: '2026-04-10T09:00:00.000Z',
    viewCount: 10,
  });
  mockedFetchComments.mockResolvedValue([]);

  renderPage();

  const likeButton = await screen.findByRole('button', { name: '좋아요 취소' });
  expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  expect(likeButton).toHaveTextContent('12');
});
