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
    fetchCommunityPostDetail: jest.fn(),
    requestPostInlineImageUpload: jest.fn(),
    updateCommunityPost: jest.fn(),
    uploadPostInlineImage: jest.fn(),
  };
});

const mockedCreatePost = jest.mocked(communityApi.createCommunityPost);
const mockedFetchDetail = jest.mocked(communityApi.fetchCommunityPostDetail);
const mockedUpdatePost = jest.mocked(communityApi.updateCommunityPost);
const mockedUploadPostInlineImage = jest.mocked(communityApi.uploadPostInlineImage);

function renderPage(initialEntry = '/community/write') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<CommunityWritePage />} path="/community/write" />
        <Route element={<CommunityWritePage />} path="/community/post/:slug/edit" />
        <Route element={<div>post detail</div>} path="/community/post/:slug" />
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
    imageUrl: 'https://cdn.example/originals/01HZTESTUUID000000000000/example.png',
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
          // R1-G: denormalized CDN URL is threaded into the request body
          // so the server can persist it alongside the mediaRef.
          imageUrl: 'https://cdn.example/originals/01HZTESTUUID000000000000/example.png',
        },
      ],
      category: '궁금해요',
      title: '실 API 글쓰기',
      topic: '일반',
    });
  });

  expect(await screen.findByText('community list')).toBeInTheDocument();
});

test('omits imageUrl from the request body when the upload grant did not return one', async () => {
  // Legacy/stub backend grant — publicUrl missing so uploadPostInlineImage
  // returns imageUrl="". The page must skip the imageUrl key entirely so
  // the server keeps post_block.image_url NULL (no empty-string poisoning).
  mockedUploadPostInlineImage.mockResolvedValue({
    mediaRef: 'media/post-inline-image/user/101/no-url.png',
    mediaId: '01HZTESTUUID000000000001',
    ownershipTicket: 'test-ticket-2',
    imageUrl: '',
  });
  mockedCreatePost.mockResolvedValue({
    authorNickname: '작성자',
    authorProfileImageRef: null,
    authorUserId: '101',
    blocks: [],
    commentCount: 0,
    createdAt: '2026-04-10T10:00:00.000Z',
    likeCount: 0,
    postId: '124',
    status: 'PUBLISHED',
    title: 'URL 없는 글',
    updatedAt: '2026-04-10T10:00:00.000Z',
    viewCount: 0,
  });

  renderPage();

  fireEvent.change(screen.getByLabelText('제목'), { target: { value: 'URL 없는 글' } });
  fireEvent.change(screen.getByLabelText('본문'), { target: { value: '본문' } });

  const fileInput = screen.getByLabelText('이미지 업로드') as HTMLInputElement;
  const file = new File(['image-bytes'], 'no-url.png', { type: 'image/png' });
  fireEvent.change(fileInput, { target: { files: [file] } });

  fireEvent.click(screen.getByRole('button', { name: '작성완료' }));

  await waitFor(() => {
    expect(mockedCreatePost).toHaveBeenCalled();
  });

  const callArg = mockedCreatePost.mock.calls[0][0];
  const imageBlock = callArg.blocks.find((b) => b.blockType === 'IMAGE');
  expect(imageBlock).toBeDefined();
  expect(imageBlock).not.toHaveProperty('imageUrl');
});

test('loads an owned post and submits a string-id update payload', async () => {
  mockedFetchDetail.mockResolvedValue({
    authorNickname: '내 닉네임',
    authorProfileImageRef: null,
    authorUserId: '101',
    blocks: [
      { blockId: 'b1', blockType: 'TEXT', content: '기존 본문', sortOrder: 0 },
      {
        blockId: 'b2',
        blockType: 'IMAGE',
        content: 'media/post-inline-image/user/101/existing.png',
        imageUrl: 'https://cdn.example/originals/existing.png',
        sortOrder: 1,
      },
    ],
    category: '궁금해요',
    commentCount: 0,
    createdAt: '2026-04-10T10:00:00.000Z',
    likeCount: 0,
    postId: '306963773430693888',
    status: 'PUBLISHED',
    title: '기존 제목',
    topic: '일반',
    updatedAt: '2026-04-10T10:00:00.000Z',
    viewCount: 0,
  });
  mockedUpdatePost.mockResolvedValue({
    authorNickname: '내 닉네임',
    authorProfileImageRef: null,
    authorUserId: '101',
    blocks: [],
    category: '궁금해요',
    commentCount: 0,
    createdAt: '2026-04-10T10:00:00.000Z',
    likeCount: 0,
    postId: '306963773430693888',
    status: 'PUBLISHED',
    title: '수정한 제목',
    topic: '일반',
    updatedAt: '2026-04-10T11:00:00.000Z',
    viewCount: 0,
  });

  renderPage('/community/post/306963773430693888/edit');

  expect(await screen.findByRole('heading', { name: '글 수정' })).toBeInTheDocument();
  expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
  expect(screen.getByLabelText('본문')).toHaveValue('기존 본문');

  fireEvent.change(screen.getByLabelText('제목'), { target: { value: '수정한 제목' } });
  fireEvent.change(screen.getByLabelText('본문'), { target: { value: '수정한 본문' } });
  fireEvent.click(screen.getByRole('button', { name: '수정완료' }));

  await waitFor(() => {
    expect(mockedUpdatePost).toHaveBeenCalledWith('306963773430693888', {
      blocks: [
        { blockType: 'TEXT', content: '수정한 본문' },
        {
          blockType: 'IMAGE',
          content: 'media/post-inline-image/user/101/existing.png',
          imageUrl: 'https://cdn.example/originals/existing.png',
        },
      ],
      category: '궁금해요',
      title: '수정한 제목',
      topic: '일반',
    });
  });
  expect(await screen.findByText('post detail')).toBeInTheDocument();
});
