import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CommunityWritePage } from '../CommunityWritePage';
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
    createCommunityPost: jest.fn(),
    requestPostInlineImageUpload: jest.fn(),
    uploadPostInlineImage: jest.fn(),
  };
});

const mockedCreatePost = jest.mocked(communityApi.createCommunityPost);
const mockedUploadPostInlineImage = jest.mocked(communityApi.uploadPostInlineImage);

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/community/write']}>
      <Routes>
        <Route element={<CommunityWritePage />} path="/community/write" />
        <Route element={<div>community list</div>} path="/community" />
        <Route element={<div>login page</div>} path="/login" />
      </Routes>
    </MemoryRouter>
  );
}

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:community-photo');
  URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  (URL.createObjectURL as jest.Mock).mockClear();
  (URL.revokeObjectURL as jest.Mock).mockClear();
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

test('uploads selected images and submits a real API post payload', async () => {
  mockedUploadPostInlineImage.mockResolvedValue({
    mediaRef: 'media/post-inline-image/user/101/example.png',
    mediaId: '01HZTESTUUID000000000000',
    ownershipTicket: 'test-ticket',
  });
  mockedCreatePost.mockResolvedValue({
    authorNickname: '작성자',
    authorProfileImageRef: null,
    authorUserId: '101',
    blocks: [],
    commentCount: 0,
    createdAt: '2026-04-10T10:00:00.000Z',
    likeCount: 0,
    postId: '123',
    status: 'PUBLISHED',
    title: '실 API 글쓰기',
    updatedAt: '2026-04-10T10:00:00.000Z',
    viewCount: 0,
  });

  renderPage();

  fireEvent.change(screen.getByLabelText('제목'), {
    target: { value: '실 API 글쓰기' },
  });
  fireEvent.change(screen.getByLabelText('본문'), {
    target: { value: '본문을 전송합니다.' },
  });

  const fileInput = screen.getByLabelText('이미지 업로드') as HTMLInputElement;
  const file = new File(['image-bytes'], 'example.png', { type: 'image/png' });
  fireEvent.change(fileInput, {
    target: { files: [file] },
  });

  fireEvent.click(screen.getByRole('button', { name: '작성완료' }));

  await waitFor(() => {
    expect(mockedUploadPostInlineImage).toHaveBeenCalledWith({
      file,
      ownerKey: '101',
    });
  });

  await waitFor(() => {
    expect(mockedCreatePost).toHaveBeenCalledWith({
      blocks: [
        { blockType: 'TEXT', content: '본문을 전송합니다.' },
        {
          blockType: 'IMAGE',
          content: 'media/post-inline-image/user/101/example.png',
          mediaId: '01HZTESTUUID000000000000',
          ownershipTicket: 'test-ticket',
        },
      ],
      category: '궁금해요',
      title: '실 API 글쓰기',
      topic: '일반',
    });
  });

  expect(await screen.findByText('community list')).toBeInTheDocument();
});
