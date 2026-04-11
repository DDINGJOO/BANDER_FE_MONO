import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError, getJson } from '../../api/client';
import { CommunityPage } from '../CommunityPage';

jest.mock('../../api/client', () => {
  const actual = jest.requireActual('../../api/client');
  return {
    ...actual,
    getJson: jest.fn(),
  };
});

const mockedGetJson = getJson as jest.MockedFunction<typeof getJson>;

function renderPage() {
  return render(
    <MemoryRouter>
      <CommunityPage />
    </MemoryRouter>,
  );
}

function getQueryParams(path: string) {
  return new URL(path, 'http://localhost').searchParams;
}

beforeEach(() => {
  mockedGetJson.mockReset();
  window.sessionStorage.clear();
});

test('loads the community feed with default API params and renders mapped cards', async () => {
  mockedGetJson.mockImplementation(async (path) => {
    expect(path).toBe('/api/v1/posts?category=&sort=latest&page=0&size=20');

    return {
      content: [
        {
          authorNickname: 'API 유저',
          category: '정보공유',
          commentCount: 3,
          createdAt: '2026-04-10T12:30:00Z',
          excerpt: '실 API에서 내려온 첫 번째 글입니다.',
          likeCount: 14,
          postId: 101,
          thumbnailUrl: 'https://cdn.example.com/post-101.png',
          title: '첫 번째 라이브 API 글',
        },
      ],
      last: false,
      number: 0,
      size: 20,
      totalElements: 21,
    };
  });

  renderPage();

  expect(screen.queryByText('커뮤니티 글을 불러오는 중입니다.')).toBeInTheDocument();

  expect(await screen.findByText('첫 번째 라이브 API 글')).toBeInTheDocument();
  expect(screen.getByText('실 API에서 내려온 첫 번째 글입니다.')).toBeInTheDocument();
  expect(screen.getByText('API 유저')).toBeInTheDocument();
  expect(screen.getByText('♥ 14')).toBeInTheDocument();
  expect(screen.getByText('• 3')).toBeInTheDocument();
  expect(screen.getByText('총 21개')).toBeInTheDocument();
  expect(screen.getByText('1페이지')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음 페이지' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
  expect(screen.getByText('첫 번째 라이브 API 글').closest('a')).toHaveAttribute(
    'href',
    '/community/post/101',
  );
});

test('refetches with the selected category query parameter', async () => {
  mockedGetJson.mockImplementation(async (path) => {
    const params = getQueryParams(path);
    const category = params.get('category');

    if (category === '') {
      return {
        hasNext: false,
        items: [
          {
            category: '정보공유',
            commentCount: 1,
            createdAt: '2026-04-10T12:30:00Z',
            excerpt: '기본 카테고리 응답입니다.',
            likeCount: 2,
            postId: 201,
            title: '기본 글',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 1,
      };
    }

    if (category === '모집') {
      return {
        hasNext: false,
        items: [
          {
            authorNickname: '모집 담당',
            category: '모집',
            commentCount: 5,
            createdAt: '2026-04-10T12:30:00Z',
            excerpt: '모집 카테고리로 다시 조회한 결과입니다.',
            likeCount: 7,
            postId: 202,
            title: '모집 중인 팀 소개',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 1,
      };
    }

    throw new Error(`Unexpected request: ${path}`);
  });

  renderPage();

  expect(await screen.findByText('기본 글')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '모집' }));

  expect(await screen.findByText('모집 중인 팀 소개')).toBeInTheDocument();
  expect(screen.getByText('모집 카테고리로 다시 조회한 결과입니다.')).toBeInTheDocument();

  await waitFor(() =>
    expect(mockedGetJson).toHaveBeenLastCalledWith(
      '/api/v1/posts?category=%EB%AA%A8%EC%A7%91&sort=latest&page=0&size=20',
      expect.anything(),
    ),
  );
});

test('changes sort order and paginates through API results', async () => {
  mockedGetJson.mockImplementation(async (path) => {
    const params = getQueryParams(path);
    const sort = params.get('sort');
    const page = Number(params.get('page') ?? '0');

    if (sort === 'latest' && page === 0) {
      return {
        hasNext: true,
        items: [
          {
            category: '궁금해요',
            commentCount: 2,
            createdAt: '2026-04-10T12:30:00Z',
            excerpt: '최신순 첫 페이지 글입니다.',
            likeCount: 3,
            postId: 301,
            title: '최신순 첫 페이지',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 21,
      };
    }

    if (sort === 'popular' && page === 0) {
      return {
        hasNext: true,
        items: [
          {
            authorNickname: '인기 유저',
            category: '정보공유',
            commentCount: 8,
            createdAt: '2026-04-10T12:30:00Z',
            excerpt: '인기순 정렬 결과입니다.',
            likeCount: 29,
            postId: 302,
            title: '인기순 첫 페이지',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 21,
      };
    }

    if (sort === 'popular' && page === 1) {
      return {
        content: [
          {
            authorNickname: '인기 유저',
            category: '정보공유',
            commentCount: 4,
            createdAt: '2026-04-09T12:30:00Z',
            excerpt: '인기순 두 번째 페이지 결과입니다.',
            likeCount: 19,
            postId: 303,
            title: '인기순 두 번째 페이지',
          },
        ],
        hasNext: false,
        page: 1,
        size: 20,
        totalElements: 21,
      };
    }

    throw new Error(`Unexpected request: ${path}`);
  });

  renderPage();

  expect(await screen.findByText('최신순 첫 페이지')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '최신순' }));
  fireEvent.click(screen.getByRole('option', { name: '인기순' }));

  expect(await screen.findByText('인기순 첫 페이지')).toBeInTheDocument();
  await waitFor(() =>
    expect(mockedGetJson).toHaveBeenLastCalledWith('/api/v1/posts?category=&sort=popular&page=0&size=20', expect.anything()),
  );

  fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

  expect(await screen.findByText('인기순 두 번째 페이지')).toBeInTheDocument();
  expect(screen.getByText('2페이지')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '이전 페이지' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();
  await waitFor(() =>
    expect(mockedGetJson).toHaveBeenLastCalledWith('/api/v1/posts?category=&sort=popular&page=1&size=20', expect.anything()),
  );
});

test('maps the comments sort option to the comments query value', async () => {
  mockedGetJson.mockImplementation(async (path) => {
    const params = getQueryParams(path);
    const sort = params.get('sort');

    if (sort === 'latest') {
      return {
        hasNext: false,
        items: [
          {
            category: '정보공유',
            commentCount: 1,
            createdAt: '2026-04-10T12:30:00Z',
            excerpt: '최신순 응답입니다.',
            likeCount: 2,
            postId: 401,
            title: '최신순 글',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 1,
      };
    }

    if (sort === 'comments') {
      return {
        hasNext: false,
        items: [
          {
            authorName: '댓글 유저',
            category: '궁금해요',
            comments: 12,
            createdAt: '2026-04-10T12:30:00Z',
            excerpt: '댓글많은순 정렬 결과입니다.',
            likeCount: 6,
            postId: 402,
            title: '댓글 많은 글',
          },
        ],
        page: 0,
        size: 20,
        totalCount: 1,
      };
    }

    throw new Error(`Unexpected request: ${path}`);
  });

  renderPage();

  expect(await screen.findByText('최신순 글')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '최신순' }));
  fireEvent.click(screen.getByRole('option', { name: '댓글많은순' }));

  expect(await screen.findByText('댓글 많은 글')).toBeInTheDocument();
  expect(screen.getByText('댓글 유저')).toBeInTheDocument();
  expect(screen.getByText('• 12')).toBeInTheDocument();

  await waitFor(() =>
    expect(mockedGetJson).toHaveBeenLastCalledWith('/api/v1/posts?category=&sort=comments&page=0&size=20', expect.anything()),
  );
});

test('shows a friendly error message when the feed request fails', async () => {
  mockedGetJson.mockRejectedValue(
    new ApiError('커뮤니티 글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 500),
  );

  renderPage();

  expect(await screen.findByRole('alert')).toHaveTextContent(
    '커뮤니티 글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
  );
  expect(screen.getByRole('button', { name: '이전 페이지' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '다음 페이지' })).toBeDisabled();
});
