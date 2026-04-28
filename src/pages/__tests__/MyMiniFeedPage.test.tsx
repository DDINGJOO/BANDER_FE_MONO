import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MyMiniFeedPage } from '../MyMiniFeedPage';
import * as communityApi from '../../api/community';
import * as chatApi from '../../api/chat';

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
    fetchMyMiniFeed: jest.fn(),
    fetchUserMiniFeed: jest.fn(),
  };
});

jest.mock('../../api/chat', () => ({
  createChatRoom: jest.fn(),
}));

const mockedFetchMyMiniFeed = jest.mocked(communityApi.fetchMyMiniFeed);
const mockedFetchUserMiniFeed = jest.mocked(communityApi.fetchUserMiniFeed);
const mockedCreateChatRoom = jest.mocked(chatApi.createChatRoom);

function renderPage(initialEntry = '/my-minifeed') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MyMiniFeedPage />} path="/my-minifeed" />
        <Route element={<MyMiniFeedPage />} path="/users/:userId/minifeed" />
        <Route element={<div>chat room</div>} path="/chat" />
        <Route element={<div>login page</div>} path="/login" />
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
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      gatewayContextToken: 'gateway-context-token',
      userId: 101,
    }),
  );
});

test('fetches the profile feed and refetches on tab and sort changes', async () => {
  mockedFetchMyMiniFeed
    .mockResolvedValueOnce({
      page: {
        hasNext: false,
        items: [
          {
            authorNickname: '뮤지션J',
            category: '꿀팁공유',
            commentCount: 2,
            createdAt: '2026-04-10T09:00:00.000Z',
            excerpt: '첫 번째 게시글 요약',
            likeCount: 4,
            postId: '11',
            thumbnailUrl: 'https://cdn.example.com/thumb-1.png',
            title: '작성한 글 제목',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 1,
      },
      profile: {
        bio: '안녕하세요. 미니피드 사용자입니다.',
        joinLabel: '26.04 가입',
        nickname: '뮤지션J',
        profileImageUrl: 'https://cdn.example.com/profile.png',
        tags: ['#밴드', '#기타'],
      },
      sort: 'latest',
      tab: 'written',
    })
    .mockResolvedValueOnce({
      page: {
        hasNext: false,
        items: [
          {
            authorNickname: '뮤지션J',
            category: '공간리뷰',
            commentCount: 3,
            createdAt: '2026-04-10T10:00:00.000Z',
            excerptLines: ['댓글단 글 미리보기'],
            likeCount: 7,
            postId: '22',
            title: '댓글단 글 제목',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 1,
      },
      profile: {
        bio: '안녕하세요. 미니피드 사용자입니다.',
        joinLabel: '26.04 가입',
        nickname: '뮤지션J',
        profileImageUrl: 'https://cdn.example.com/profile.png',
        tags: ['#밴드', '#기타'],
      },
      sort: 'latest',
      tab: 'commented',
    })
    .mockResolvedValueOnce({
      page: {
        hasNext: false,
        items: [
          {
            authorNickname: '뮤지션J',
            category: '공간리뷰',
            commentCount: 10,
            excerptLines: ['인기순으로 다시 정렬된 게시글'],
            likeCount: 30,
            postId: '33',
            title: '인기 게시글 제목',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 1,
      },
      profile: {
        bio: '안녕하세요. 미니피드 사용자입니다.',
        joinLabel: '26.04 가입',
        nickname: '뮤지션J',
        profileImageUrl: 'https://cdn.example.com/profile.png',
        tags: ['#밴드', '#기타'],
      },
      sort: 'popular',
      tab: 'commented',
    });

  renderPage();

  expect(await screen.findByText('작성한 글 제목')).toBeInTheDocument();
  expect(mockedFetchMyMiniFeed).toHaveBeenNthCalledWith(1, {
    page: 0,
    size: 20,
    sort: 'latest',
    tab: 'written',
  });
  expect(screen.getAllByText('뮤지션J').length).toBeGreaterThan(0);
  expect(screen.getByText('1개의 게시글')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: '댓글단 글' }));

  expect(await screen.findByText('댓글단 글 제목')).toBeInTheDocument();
  expect(mockedFetchMyMiniFeed).toHaveBeenNthCalledWith(2, {
    page: 0,
    size: 20,
    sort: 'latest',
    tab: 'commented',
  });

  fireEvent.click(screen.getByRole('button', { name: '최신순' }));
  fireEvent.click(screen.getByRole('option', { name: '인기순' }));

  await waitFor(() => {
    expect(mockedFetchMyMiniFeed).toHaveBeenNthCalledWith(3, {
      page: 0,
      size: 20,
      sort: 'popular',
      tab: 'commented',
    });
  });

  expect(await screen.findByText('인기 게시글 제목')).toBeInTheDocument();
});

test('loads another user mini feed without requiring login', async () => {
  window.sessionStorage.clear();
  mockedFetchUserMiniFeed.mockResolvedValue({
    page: {
      hasNext: false,
      items: [
        {
          authorNickname: '타인',
          category: '궁금해요',
          commentCount: 3,
          createdAt: '2026-04-10T09:00:00.000Z',
          excerpt: '타인이 작성한 글 미리보기',
          likeCount: 8,
          postId: '306963773430693888',
          title: '타인 피드 게시글',
        },
      ],
      page: 0,
      size: 20,
      totalCount: 1,
    },
    profile: {
      bio: '공개 미니피드입니다.',
      joinLabel: '26.04 가입',
      nickname: '타인',
      profileImageUrl: null,
      userId: '306963773430693888',
      tags: ['#드럼'],
    },
    sort: 'latest',
    tab: 'written',
  });

  renderPage('/users/306963773430693888/minifeed');

  expect(await screen.findByRole('heading', { name: '타인 미니피드' })).toBeInTheDocument();
  expect(mockedFetchUserMiniFeed).toHaveBeenCalledWith('306963773430693888', {
    page: 0,
    size: 20,
    sort: 'latest',
    tab: 'written',
  });
  expect(mockedFetchMyMiniFeed).not.toHaveBeenCalled();
  expect(screen.getByText('타인 피드 게시글')).toBeInTheDocument();
  expect(screen.getByText('장르 · 악기')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '채팅하기' })).toBeInTheDocument();
  expect(screen.queryByText('수정하기')).not.toBeInTheDocument();
  expect(screen.queryByText('login page')).not.toBeInTheDocument();
});

test('creates a personal chat from another user mini feed using the string user id', async () => {
  mockedFetchUserMiniFeed.mockResolvedValue({
    page: {
      hasNext: false,
      items: [],
      page: 0,
      size: 20,
      totalCount: 0,
    },
    profile: {
      bio: '기타 연주자입니다.',
      joinLabel: '26.04 가입',
      nickname: '기타유저',
      profileImageUrl: null,
      userId: '307057320825716736',
      tags: ['락', '기타'],
    },
    sort: 'latest',
    tab: 'written',
  });
  mockedCreateChatRoom.mockResolvedValue({
    chatRoomId: '900',
    chatRoomType: 'PERSONAL',
    createdAt: '2026-04-28T00:00:00.000Z',
    lastMessageAt: null,
    lastMessagePreview: null,
    participantA: '101',
    participantB: '307057320825716736',
    partnerNickname: '기타유저',
    partnerProfileImage: null,
    status: 'ACTIVE',
    unreadCount: 0,
    vendorId: null,
    vendorSlug: null,
  });

  renderPage('/users/307057320825716736/minifeed');

  fireEvent.click(await screen.findByRole('button', { name: '채팅하기' }));

  await waitFor(() => {
    expect(mockedCreateChatRoom).toHaveBeenCalledWith({
      targetUserId: '307057320825716736',
    });
  });
  expect(await screen.findByText('chat room')).toBeInTheDocument();
});
