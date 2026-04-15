import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MyMiniFeedPage } from '../MyMiniFeedPage';
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
    fetchMyMiniFeed: jest.fn(),
  };
});

const mockedFetchMyMiniFeed = jest.mocked(communityApi.fetchMyMiniFeed);

function renderPage(initialEntry = '/my-minifeed') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MyMiniFeedPage />} path="/my-minifeed" />
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
