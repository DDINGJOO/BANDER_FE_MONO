import React from 'react';
import { act } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

const signupTerms = [
  {
    contentUrl:
      'https://bander-co-kr.notion.site/BANDER-2025-12-08-2c17b25b471a806faf7df1d45351977d?pvs=74',
    effectiveAt: '2026-03-21T00:00:00',
    required: true,
    termCode: 'SERVICE_USE',
    title: '서비스 이용약관 동의',
    version: '2026-03',
  },
  {
    contentUrl:
      'https://bander-co-kr.notion.site/2025-12-08-2c17b25b471a8072bc14ce45cade65f1?pvs=74',
    effectiveAt: '2026-03-21T00:00:00',
    required: true,
    termCode: 'PRIVACY_SHARE',
    title: '개인정보 제3자 정보 제공 동의',
    version: '2026-03',
  },
  {
    contentUrl:
      'https://bander-co-kr.notion.site/2025-12-08-2c17b25b471a8069ba13dd9732d107e7?pvs=74',
    effectiveAt: '2026-03-21T00:00:00',
    required: false,
    termCode: 'MARKETING',
    title: '마케팅 정보 수신동의',
    version: '2026-03',
  },
];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

function apiSuccess<T>(data: T) {
  return Promise.resolve({
    json: async () => ({
      data,
      success: true,
    }),
    ok: true,
  } as Response);
}

function futureIso(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function seedSignupDraft(
  draft: Record<string, unknown> = {
    email: 'bander@gmail.com',
    signupCompletionToken: 'signup-token',
    verifiedEmailToken: 'verified-email-token',
  }
) {
  window.sessionStorage.setItem('bander.signupDraft', JSON.stringify(draft));
}

function seedPasswordResetDraft(
  draft: Record<string, unknown> = {
    email: 'bander@gmail.com',
    passwordResetToken: 'reset-token',
  }
) {
  window.sessionStorage.setItem('bander.passwordResetDraft', JSON.stringify(draft));
}

function seedAuthSession(
  session: Record<string, unknown> = {
    expiresAt: futureIso(30),
    gatewayContextToken: 'gateway-context-token',
    userId: 101,
  }
) {
  window.sessionStorage.setItem('bander.authSession', JSON.stringify(session));
}

function buildMiniFeedItems(tab: 'written' | 'commented') {
  return Array.from({ length: 5 }, (_, index) => ({
    authorNickname: '뮤지션J',
    category: tab === 'written' ? '꿀팁공유' : '공간리뷰',
    commentCount: index + 1,
    createdAt: `2026-04-10T0${index}:00:00.000Z`,
    excerpt: `${tab} 탭 게시글 미리보기 ${index + 1}`,
    likeCount: index + 3,
    postId: index + 1,
    thumbnailUrl: index < 2 ? `https://cdn.example.com/thumb-${index + 1}.png` : null,
    title: `${tab === 'written' ? '작성한 글' : '댓글단 글'} 제목 ${index + 1}`,
  }));
}

function createCommunityDetailComments() {
  return [
    {
      comment: {
        authorNickname: '연습집중중',
        authorProfileImageRef: null,
        authorUserId: 201,
        commentId: 1,
        content: '첫 댓글입니다.',
        createdAt: '2026-04-10T09:00:00.000Z',
        depth: 0,
        parentId: null,
        postId: 123,
      },
      replies: [
        {
          authorNickname: '내 닉네임',
          authorProfileImageRef: null,
          authorUserId: 101,
          commentId: 2,
          content: '삭제할 내 답글',
          createdAt: '2026-04-10T09:05:00.000Z',
          depth: 1,
          parentId: 1,
          postId: 123,
        },
        {
          authorNickname: '다른 답글 작성자',
          authorProfileImageRef: null,
          authorUserId: 202,
          commentId: 3,
          content: '다른 답글',
          createdAt: '2026-04-10T09:06:00.000Z',
          depth: 1,
          parentId: 1,
          postId: 123,
        },
      ],
    },
    {
      comment: {
        authorNickname: 'band_123',
        authorProfileImageRef: null,
        authorUserId: 203,
        commentId: 4,
        content: '두 번째 댓글입니다.',
        createdAt: '2026-04-10T09:10:00.000Z',
        depth: 0,
        parentId: null,
        postId: 123,
      },
      replies: [],
    },
    {
      comment: {
        authorNickname: 'music_life',
        authorProfileImageRef: null,
        authorUserId: 204,
        commentId: 5,
        content: '세 번째 댓글입니다.',
        createdAt: '2026-04-10T09:20:00.000Z',
        depth: 0,
        parentId: null,
        postId: 123,
      },
      replies: [],
    },
  ];
}

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:profile-preview');
  URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  window.sessionStorage.clear();
  let communityDetailComments = createCommunityDetailComments();
  let communityLiked = false;
  global.fetch = jest.fn();
  (global.fetch as jest.Mock).mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? 'GET';

      if (url.endsWith('/api/v1/home/feed') && method === 'GET') {
        return apiSuccess({
          categoryBubbles: [],
          hotPosts: [],
          recommendedSpaces: [],
          reviewCards: [],
          vendorCards: [],
        });
      }

      if (url.includes('/api/v1/search/suggestions') && method === 'GET') {
        return apiSuccess({
          suggestions: [],
        });
      }

      if (url.includes('/api/v1/search/rooms') && method === 'GET') {
        return apiSuccess({
          page: 0,
          rooms: [
            {
              available: true,
              category: '합주실',
              description: '그랜드 피아노와 드럼이 준비된 합주실',
              latitude: 37.555,
              longitude: 126.923,
              maxCapacity: 8,
              minCapacity: 1,
              parkingAvailable: true,
              popularityScore: 100,
              pricePerSlot: 10000,
              roadAddress: '서울 마포구 서교동',
              roomId: 11,
              roomName: 'A룸 그랜드 피아노 대관',
              roomSlug: 'a-room-grand-piano-rental',
              slotUnit: '30MIN',
              studioId: 22,
              studioName: '업비트스튜디오',
              studioSlug: 'upbeat-studio',
              thumbnailUrl: 'https://cdn.example.com/a-room.png',
            },
            {
              available: true,
              category: '합주실',
              description: '업라이트 피아노 연습실',
              latitude: 37.556,
              longitude: 126.924,
              maxCapacity: 4,
              minCapacity: 1,
              parkingAvailable: false,
              popularityScore: 90,
              pricePerSlot: 12000,
              roadAddress: '서울 마포구 동교동',
              roomId: 12,
              roomName: '영창 업라이트 피아노 연습실',
              roomSlug: 'yeongchang-upright-room',
              slotUnit: '30MIN',
              studioId: 23,
              studioName: '서울스트리트퍼포먼스',
              studioSlug: 'seoul-street-performance',
              thumbnailUrl: 'https://cdn.example.com/upright-room.png',
            },
            {
              available: true,
              category: '합주실',
              description: '재즈 합주 공간',
              latitude: 37.557,
              longitude: 126.925,
              maxCapacity: 6,
              minCapacity: 1,
              parkingAvailable: false,
              popularityScore: 80,
              pricePerSlot: 13000,
              roadAddress: '서울 마포구 동교동',
              roomId: 13,
              roomName: '재즈 합주실',
              roomSlug: 'jazz-ensemble-room',
              slotUnit: '30MIN',
              studioId: 24,
              studioName: '예쎄뮤직',
              studioSlug: 'yesse-music',
              thumbnailUrl: 'https://cdn.example.com/jazz-room.png',
            },
            {
              available: true,
              category: '합주실',
              description: '야마하 U3 피아노가 있는 룸',
              latitude: 37.558,
              longitude: 126.926,
              maxCapacity: 4,
              minCapacity: 1,
              parkingAvailable: true,
              popularityScore: 70,
              pricePerSlot: 14000,
              roadAddress: '서울 마포구 신수동',
              roomId: 14,
              roomName: '야마하 U3 피아노 연습실',
              roomSlug: 'yamaha-u3-room',
              slotUnit: '30MIN',
              studioId: 25,
              studioName: '자하브합주실',
              studioSlug: 'jahav-room',
              thumbnailUrl: 'https://cdn.example.com/u3-room.png',
            },
          ],
          size: 20,
          totalElements: 4,
          totalPages: 1,
        });
      }

      if (url.includes('/api/v1/search/vendors') && method === 'GET') {
        return apiSuccess({
          hasNext: false,
          items: [
            {
              address: '서울 마포구',
              description: '합주실 전문 업체',
              id: 'vendor-1',
              name: '유스뮤직',
              slug: 'youth-music',
              thumbnailUrl: 'https://cdn.example.com/vendor-1.png',
            },
            {
              address: '서울 마포구',
              description: '밴드 합주 전문',
              id: 'vendor-2',
              name: '방구석 뮤지션의 합주실',
              slug: 'banggu-musician',
              thumbnailUrl: 'https://cdn.example.com/vendor-2.png',
            },
            {
              address: '서울 마포구',
              description: '연습실 예약',
              id: 'vendor-3',
              name: '챗츠뮤직',
              slug: 'chats-music',
              thumbnailUrl: 'https://cdn.example.com/vendor-3.png',
            },
          ],
          nextCursor: null,
          size: 20,
          totalCount: 3,
        });
      }

      if (url.includes('/api/v1/search/posts') && method === 'GET') {
        return apiSuccess({
          hasNext: false,
          items: [
            {
              authorUserId: 'neowmeow',
              createdAt: '2026-04-10',
              id: '1',
              title: '서울 지역 연습실습실 가격 비교 정리했습니다 🎵',
            },
            {
              authorUserId: 'bander',
              createdAt: '2026-04-10',
              id: '2',
              title: '홍대 합주실 예약 후기 - 가성비 괜찮은 편입니다',
            },
            {
              authorUserId: 'user-3',
              createdAt: '2026-04-10',
              id: '3',
              title: '공간 임대/프린트 출력 있으면 본 계신가요?',
            },
            { authorUserId: 'user-4', createdAt: '2026-04-10', id: '4', title: '강남·신촌 연습실 월 대관 비교 (2026 기준)' },
            { authorUserId: 'user-5', createdAt: '2026-04-10', id: '5', title: '[모집] 수요일 밤 합주 멤버 베이스 구해요' },
            { authorUserId: 'user-6', createdAt: '2026-04-10', id: '6', title: '신림 소형 룸 이용 후기 (사진 많음)' },
            { authorUserId: 'user-7', createdAt: '2026-04-10', id: '7', title: '보컬용 이펙터 추천 좀 해주세요!' },
          ],
          nextCursor: null,
          size: 20,
          totalCount: 7,
        });
      }

      if (url.includes('/api/v1/posts?') && method === 'GET') {
        return apiSuccess({
          hasNext: false,
          items: [
            {
              authorNickname: 'neowmeow',
              category: '궁금해요',
              commentCount: 5,
              createdAt: '2026-04-10T08:30:00.000Z',
              id: '123',
              likes: 189,
              postedAtLabel: '26.04.10',
              thumbnailUrl: null,
              title: '실 API 게시글 상세 테스트',
            },
          ],
          page: 0,
          size: 20,
          totalCount: 1,
        });
      }

      if (url.endsWith('/api/v1/spaces/slug/a-room-grand-piano-rental') && method === 'GET') {
        return apiSuccess({
          address: '서울시 마포구 독막로9길 31 지하 1층',
          category: '합주실',
          couponStripLabel: '사용 가능한 쿠폰',
          description: '업비트스튜디오의 대표 그랜드 피아노 룸입니다.',
          detailBenefitChips: [{ label: '그랜드피아노' }],
          facilityChips: [{ key: 'parking', label: '주차 가능' }],
          galleryUrls: [
            'https://cdn.example.com/a-room.png',
            'https://cdn.example.com/a-room-2.png',
          ],
          hashTags: ['#합주실', '#그랜드피아노'],
          id: '11',
          latitude: 37.555,
          location: '서울 마포구 서교동',
          longitude: 126.923,
          notices: [{ body: '시설 이용 시 주의해 주세요.', imageUrl: null, title: '이용 안내' }],
          operatingSummary: '매일 09:00 - 24:00',
          operatingWeek: [{ hours: '09:00 - 24:00', isToday: true, weekday: '월' }],
          policies: [{ body: '음식물 반입은 제한됩니다.', imageUrl: null, title: '환불 규정' }],
          priceLabel: '10,000원',
          priceSuffix: ' / 30분',
          pricingLines: [{ label: '기본 요금', value: '10,000원' }],
          rating: '5.0',
          reviewCount: 12,
          slug: 'a-room-grand-piano-rental',
          stationDistanceLabel: '합정역 도보 5분',
          studioId: '22',
          studioName: '업비트스튜디오',
          title: 'A룸 그랜드 피아노 대관',
          trustBanner: '믿고 예약할 수 있는 공간',
          vendor: { name: '업비트스튜디오', spaces: '15개의 공간' },
          vendorSlug: 'upbeat-studio',
        });
      }

      if (url.includes('/api/v1/spaces/22/reviews') && method === 'GET') {
        return apiSuccess({
          items: [],
        });
      }

      if (url.endsWith('/api/v1/users/me/summary') && method === 'GET') {
        return apiSuccess({
          couponCountLabel: '0장',
          displayName: '테스트유저',
          email: 'bander@gmail.com',
          pointsLabel: '0P',
          profileImageRef: null,
          reservationBadgeCount: 0,
        });
      }

      if (url.endsWith('/api/v1/users/me/account') && method === 'GET') {
        return apiSuccess({
          createdAt: '2026-01-01T00:00:00.000Z',
          email: 'bander@gmail.com',
          nickname: '테스트유저',
          phoneMasked: '010-****-9961',
          phoneVerified: true,
          profileImageRef: null,
          status: 'ACTIVE',
          userId: '101',
        });
      }

      if (url.includes('/api/v1/users/me/feed/posts') && method === 'GET') {
        const params = new URL(url, 'http://localhost').searchParams;
        const tab = params.get('tab') === 'commented' ? 'commented' : 'written';
        return apiSuccess({
          page: {
            hasNext: false,
            items: buildMiniFeedItems(tab),
            page: 0,
            size: 20,
            totalCount: 5,
          },
          profile: {
            bio: '안녕하세요 뮤지션J 입니다.',
            joinLabel: '26.04 가입',
            nickname: '뮤지션J',
            profileImageUrl: 'https://cdn.example.com/profile.png',
            tags: ['#록/메탈', '#밴드', '#피아노', '#기타'],
          },
          sort: params.get('sort') ?? 'latest',
          tab,
        });
      }

      if (url.endsWith('/api/v1/posts/123') && method === 'GET') {
        return apiSuccess({
          authorNickname: 'neowmeow',
          authorProfileImageRef: null,
          authorUserId: 999,
          blocks: [
            {
              blockId: 1,
              blockType: 'TEXT',
              content: '실 API로 불러온 커뮤니티 상세 본문입니다.',
              sortOrder: 0,
            },
          ],
          categoryLabel: '궁금해요',
          commentCount: 5,
          createdAt: '2026-04-10T08:30:00.000Z',
          likeCount: 189,
          likedByViewer: communityLiked,
          postId: 123,
          status: 'PUBLISHED',
          title: '실 API 게시글 상세 테스트',
          updatedAt: '2026-04-10T08:30:00.000Z',
          viewCount: 42,
        });
      }

      if (url.endsWith('/api/v1/posts/123/comments') && method === 'GET') {
        return apiSuccess(communityDetailComments);
      }

      if (url.endsWith('/api/v1/posts/123/reactions') && method === 'POST') {
        communityLiked = !communityLiked;
        return apiSuccess({ liked: communityLiked });
      }

      if (url.includes('/api/v1/posts/123/comments/') && method === 'DELETE') {
        const commentId = Number(url.split('/').pop());
        communityDetailComments = communityDetailComments
          .map((thread) => ({
            ...thread,
            replies: thread.replies.filter((reply) => reply.commentId !== commentId),
          }))
          .filter((thread) => thread.comment.commentId !== commentId);
        return apiSuccess(null);
      }

      if (url.endsWith('/api/v1/auth/signup/request') && method === 'POST') {
        return apiSuccess({
          dispatchType: 'CREATED',
          expiresAt: futureIso(5),
          resendAvailableAt: futureIso(1),
        });
      }

      if (url.endsWith('/api/v1/auth/signup/resend') && method === 'POST') {
        return apiSuccess({
          dispatchType: 'RESENT_EXISTING',
          expiresAt: futureIso(5),
          resendAvailableAt: futureIso(1),
        });
      }

      if (url.endsWith('/api/v1/auth/signup/verify') && method === 'POST') {
        return apiSuccess({
          expiresAt: futureIso(2),
          verifiedEmailToken: 'verified-email-token',
        });
      }

      if (url.endsWith('/api/v1/auth/signup/registration') && method === 'POST') {
        return apiSuccess({
          expiresAt: futureIso(30),
          signupCompletionToken: 'signup-token',
          status: 'PENDING_VERIFICATION',
          userId: 101,
        });
      }

      if (url.endsWith('/api/v1/auth/social/login') && method === 'POST') {
        return apiSuccess({
          email: 'social@example.com',
          expiresAt: futureIso(30),
          gatewayContextToken: 'social-gateway-token',
          newUser: true,
          nickname: '소셜밴더',
          profileImageUrl: null,
          roles: ['USER'],
          signupCompletionExpiresAt: futureIso(30),
          signupCompletionToken: 'social-signup-token',
          userId: '202',
        });
      }

      if (url.includes('/api/v1/auth/signup/nickname/availability') && method === 'GET') {
        const nickname = new URL(url, 'http://localhost').searchParams.get('nickname');
        return apiSuccess({
          available: nickname !== '활기찬다람쥐',
        });
      }

      if (url.endsWith('/api/v1/auth/signup/terms') && method === 'GET') {
        return apiSuccess(signupTerms);
      }

      if (url.endsWith('/api/v1/auth/signup/completion') && method === 'POST') {
        return apiSuccess({
          status: 'ACTIVE',
          userId: 101,
        });
      }

      if (url.endsWith('/api/v1/auth/password/reset/request') && method === 'POST') {
        return apiSuccess({
          dispatchType: 'CREATED',
          expiresAt: futureIso(5),
          resendAvailableAt: futureIso(1),
        });
      }

      if (url.endsWith('/api/v1/auth/password/reset/resend') && method === 'POST') {
        return apiSuccess({
          dispatchType: 'RESENT_EXISTING',
          expiresAt: futureIso(5),
          resendAvailableAt: futureIso(1),
        });
      }

      if (url.endsWith('/api/v1/auth/password/reset/verify') && method === 'POST') {
        return apiSuccess({
          expiresAt: futureIso(15),
          passwordResetToken: 'reset-token',
        });
      }

      if (url.endsWith('/api/v1/auth/password/reset/confirm') && method === 'POST') {
        return apiSuccess({
          userId: 101,
        });
      }

      if (url.endsWith('/api/v1/auth/login') && method === 'POST') {
        return apiSuccess({
          expiresAt: futureIso(5),
          gatewayContextToken: 'gateway-context-token',
          userId: 101,
        });
      }

      throw new Error(`Unhandled fetch request: ${method} ${url}`);
    }
  );
});

test('renders the guest home page on the root route', () => {
  renderAt('/');

  expect(screen.getByRole('heading', { name: /이달의 HOT 게시물/ })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: '로그인/회원가입' }).length).toBeGreaterThan(0);
  expect(screen.getByPlaceholderText('어떤 공간을 찾으시나요?')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '검색' })).toBeInTheDocument();
});

test('navigates from main hero search to search results', () => {
  renderAt('/');

  fireEvent.change(screen.getByPlaceholderText('어떤 공간을 찾으시나요?'), {
    target: { value: '그랜드 피아노' },
  });
  fireEvent.click(screen.getByRole('button', { name: '검색' }));

  expect(screen.getByRole('heading', { name: /그랜드 피아노.*검색 결과/ })).toBeInTheDocument();
});

test('navigates to the community page when clicking the header community link', () => {
  renderAt('/');

  fireEvent.click(screen.getByRole('link', { name: '커뮤니티' }));

  expect(screen.getByRole('heading', { name: '전체 커뮤니티' })).toBeInTheDocument();
});

test('renders my mini-feed page', async () => {
  seedAuthSession();
  renderAt('/my-minifeed');

  expect(screen.getByRole('heading', { level: 1, name: '내 미니피드' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '작성한 글' })).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByText('5개의 게시글')).toBeInTheDocument();
});

test('my mini-feed commented tab matches Figma (6419:81316)', async () => {
  seedAuthSession();
  renderAt('/my-minifeed?tab=commented');

  expect(screen.getByRole('tab', { name: '댓글단 글' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: '작성한 글' })).toHaveAttribute('aria-selected', 'false');
  expect(await screen.findByText('5개의 게시글')).toBeInTheDocument();
});

test('renders the community write page', () => {
  renderAt('/community/write');

  expect(screen.getByRole('heading', { level: 1, name: '글쓰기' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '작성완료' })).toBeDisabled();
});

test('community FAB opens the write page', () => {
  renderAt('/community');

  fireEvent.click(screen.getByRole('button', { name: '글쓰기' }));

  expect(screen.getByRole('heading', { level: 1, name: '글쓰기' })).toBeInTheDocument();
});

test('renders the community post detail page from API data', async () => {
  renderAt('/community/post/123');

  expect(
    await screen.findByRole('heading', { level: 1, name: '실 API 게시글 상세 테스트' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '댓글 5' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/community');
});

test('community post detail opens delete modal and decrements count on confirm', async () => {
  seedAuthSession();
  renderAt('/community/post/123');

  expect(await screen.findByRole('heading', { level: 1, name: '실 API 게시글 상세 테스트' })).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: '삭제하기' })[0]);

  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText('해당 댓글을 삭제하시겠어요?')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '삭제' }));

  await waitFor(() => {
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
  expect(await screen.findByRole('heading', { name: '댓글 4' })).toBeInTheDocument();
});

test('community post detail opens post report confirm then report modal from 게시글 신고', async () => {
  renderAt('/community/post/123');

  expect(await screen.findByRole('heading', { level: 1, name: '실 API 게시글 상세 테스트' })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '게시글 신고' }));

  const confirm = screen.getByRole('alertdialog');
  expect(within(confirm).getByText('게시글 신고')).toBeInTheDocument();
  expect(within(confirm).getByText('선택하신 게시글을 신고하시겠어요?')).toBeInTheDocument();

  fireEvent.click(within(confirm).getByRole('button', { name: '신고' }));

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getByText('어떤 문제가 있나요?')).toBeInTheDocument();
});

test('community post detail opens report modal from comment 신고하기', async () => {
  renderAt('/community/post/123');

  expect(await screen.findByRole('heading', { level: 1, name: '실 API 게시글 상세 테스트' })).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: '신고하기' })[0]);

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(screen.getByText('어떤 문제가 있나요?')).toBeInTheDocument();
  expect(
    screen.getByPlaceholderText(
      '신고 사유를 상세히 남겨 주시면 내용 확인 시 많은 도움이 됩니다.',
    ),
  ).toBeInTheDocument();

  const submitInDialog = () =>
    screen.getAllByRole('button', { name: '신고하기' }).find((el) => dialog.contains(el));

  expect(submitInDialog()).toBeDisabled();

  fireEvent.change(
    screen.getByPlaceholderText(
      '신고 사유를 상세히 남겨 주시면 내용 확인 시 많은 도움이 됩니다.',
    ),
    { target: { value: '부적절한 내용' } },
  );

  expect(submitInDialog()).not.toBeDisabled();
});

test('renders the authenticated header preview on the home-auth route', () => {
  renderAt('/home-auth');

  expect(screen.getByRole('link', { name: '커뮤니티' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '탐색' })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /예약/ })[0]).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '장바구니' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '찜 목록' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '알림' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '프로필 메뉴' })).toBeInTheDocument();
});

test('moves to the search results page when submitting the header search', async () => {
  renderAt('/home-auth');

  fireEvent.change(screen.getByPlaceholderText('공간, 업체, 커뮤니티 검색'), {
    target: { value: '합주' },
  });
  fireEvent.keyDown(screen.getByPlaceholderText('공간, 업체, 커뮤니티 검색'), {
    code: 'Enter',
    key: 'Enter',
  });

  expect(await screen.findByRole('heading', { name: /합주.*검색 결과/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '업체' })).toBeInTheDocument();
  expect(await screen.findByText('4개의 공간')).toBeInTheDocument();
});

test('switches search result tabs and opens the community sort menu', async () => {
  renderAt('/search?q=합주');

  fireEvent.click(screen.getByRole('button', { name: '업체' }));
  expect(await screen.findByText('3개의 업체')).toBeInTheDocument();
  expect(await screen.findByText('유스뮤직')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '커뮤니티' }));
  expect(await screen.findByText('7개의 게시글')).toBeInTheDocument();
  expect(await screen.findByText('서울 지역 연습실습실 가격 비교 정리했습니다 🎵')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '최신순' }));
  expect(screen.getByRole('button', { name: '좋아요 많은 순' })).toBeInTheDocument();
});

test('moves to the room detail page when clicking a space card', async () => {
  seedAuthSession();
  renderAt('/search?q=합주');

  fireEvent.click(await screen.findByText('A룸 그랜드 피아노 대관'));

  expect(
    await screen.findByRole('heading', { level: 1, name: 'A룸 그랜드 피아노 대관' })
  ).toBeInTheDocument();
  expect(screen.getAllByText('업비트스튜디오').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('업체 정보')).toBeInTheDocument();
  expect(await screen.findByText('완료 (010-****-9961)')).toBeInTheDocument();
  expect(screen.queryByText('테스트 보기')).not.toBeInTheDocument();

  expect(screen.getByText('날짜 선택')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '20' }));
  expect(screen.getByText('2025년 8월 20일 (수)')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '선택완료' }));
  expect(await screen.findByRole('heading', { name: '예약하기' })).toBeInTheDocument();
  const payButtonMatcher = /총 [\d,]+원 결제하기/;
  expect(screen.getByRole('button', { name: payButtonMatcher })).toBeDisabled();

  const firstBookableSlot = screen
    .getAllByRole('button')
    .find(
      (el) =>
        el.className.includes('space-reservation__timeline-slot') &&
        !el.className.includes('space-reservation__timeline-slot--disabled')
    );
  expect(firstBookableSlot).toBeTruthy();
  fireEvent.mouseDown(firstBookableSlot as HTMLButtonElement);
  expect(screen.getByRole('button', { name: payButtonMatcher })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: /전체동의/ }));
  expect(screen.getByRole('button', { name: payButtonMatcher })).toBeEnabled();
});

test('opens the guest modal from the home page and moves to login', () => {
  renderAt('/');

  fireEvent.click(screen.getAllByRole('button', { name: '로그인/회원가입' })[0]);

  expect(screen.getByText('안녕하세요 게스트님!')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '로그인/회원가입 하기' }));

  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
});

test('opens the date-time picker and renders the dual slider controls', () => {
  renderAt('/');

  fireEvent.click(screen.getByRole('button', { name: '날짜선택' }));

  expect(screen.getByText('시간 선택')).toBeInTheDocument();
  expect(screen.getByRole('slider', { name: '검색 시작 시간' })).toBeInTheDocument();
  expect(screen.getByRole('slider', { name: '검색 종료 시간' })).toBeInTheDocument();
});

test('shows applied summaries on the hero search filters after selection', () => {
  renderAt('/');

  fireEvent.click(screen.getAllByRole('button', { name: /^지역/ })[0]);
  fireEvent.click(screen.getByRole('button', { name: '서울' }));
  fireEvent.click(screen.getByRole('button', { name: '강남구' }));
  fireEvent.click(screen.getByRole('button', { name: '선택완료' }));

  expect(screen.getByRole('button', { name: /강남구/ })).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole('button', { name: /^악기$/ })[0]);
  fireEvent.click(screen.getByRole('button', { name: '#합주실' }));
  fireEvent.click(screen.getByRole('button', { name: '#연습실' }));
  fireEvent.click(screen.getByRole('button', { name: '선택완료' }));

  expect(screen.getByRole('button', { name: /악기 2/ })).toBeInTheDocument();
});

test('clears an applied hero filter from the active filter x button', () => {
  renderAt('/');

  fireEvent.click(screen.getAllByRole('button', { name: /^지역/ })[0]);
  fireEvent.click(screen.getByRole('button', { name: '서울' }));
  fireEvent.click(screen.getByRole('button', { name: '강남구' }));
  fireEvent.click(screen.getByRole('button', { name: '선택완료' }));

  expect(screen.getByRole('button', { name: /강남구/ })).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('지역 필터 초기화'));

  expect(screen.getAllByRole('button', { name: /^지역/ })[0]).toBeInTheDocument();
});

test('renders the login page on the login route', () => {
  renderAt('/login');

  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText('이메일을 입력해주세요.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup');
  expect(screen.getByRole('link', { name: '비밀번호 찾기' })).toHaveAttribute(
    'href',
    '/forgot-password'
  );
});

test('submits login and returns to the home page', async () => {
  renderAt('/login');

  fireEvent.change(screen.getByPlaceholderText('이메일을 입력해주세요.'), {
    target: { value: 'bander@gmail.com' },
  });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력해주세요.'), {
    target: { value: 'password-123!' },
  });

  fireEvent.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() =>
    expect(window.sessionStorage.getItem('bander.authSession')).toContain('gateway-context-token')
  );
  expect(await screen.findByRole('heading', { name: /이달의 HOT 게시물/ })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /예약/ })[0]).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '로그인/회원가입' })).not.toBeInTheDocument();
});

test('renders the forgot password page on the forgot-password route', () => {
  renderAt('/forgot-password');

  expect(screen.getByRole('heading', { name: '비밀번호 찾기' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText('가입하신 이메일을 입력해주세요.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '인증받기' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
});

test('forgot-password uses API verification and moves to reset-password page', async () => {
  renderAt('/forgot-password');

  fireEvent.change(screen.getByLabelText('가입 이메일'), {
    target: { value: 'bander@gmail.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: '인증받기' }));

  expect(await screen.findByPlaceholderText('인증번호를 입력해주세요.')).toBeInTheDocument();
  expect(screen.getByText(/0[45]:[0-5][0-9]/)).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('인증번호를 입력해주세요.'), {
    target: { value: '123456' },
  });

  expect(await screen.findByText('인증완료')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  expect(await screen.findByLabelText('새 비밀번호')).toBeInTheDocument();
  expect(window.sessionStorage.getItem('bander.passwordResetDraft')).toContain('reset-token');
});

test('forgot-password reset page shows completion modal and returns to login', async () => {
  seedPasswordResetDraft();
  renderAt('/forgot-password/reset');

  fireEvent.change(screen.getByLabelText('새 비밀번호'), {
    target: { value: 'abcd1234!' },
  });
  fireEvent.change(screen.getByPlaceholderText('새 비밀번호를 재입력해주세요.'), {
    target: { value: 'abcd1234!' },
  });

  fireEvent.click(screen.getByRole('button', { name: '비밀번호 설정하고 로그인하러 가기!' }));

  expect(await screen.findByText('비밀번호 설정 완료!')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '로그인 하러 가기' }));

  expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument();
});

test('renders my scraps page with 저장/최근 본 tabs', () => {
  renderAt('/my-scraps');

  expect(screen.getByRole('heading', { level: 1, name: '내 스크랩' })).toBeInTheDocument();
  const savedTab = screen.getByRole('tab', { name: /저장\s+\d+/ });
  const recentTab = screen.getByRole('tab', { name: /최근 본\s+\d+/ });
  expect(savedTab).toHaveAttribute('aria-selected', 'true');
  expect(recentTab).toHaveAttribute('aria-selected', 'false');

  expect(screen.getAllByRole('link', { name: /Moon 합주실 룸/ }).length).toBeGreaterThan(0);

  fireEvent.click(recentTab);
  expect(recentTab).toHaveAttribute('aria-selected', 'true');
  expect(savedTab).toHaveAttribute('aria-selected', 'false');
  expect(screen.getAllByRole('link', { name: /GROOVE/ }).length).toBeGreaterThan(0);
});

test('my scraps: unscrapping in 저장 tab flips state in 최근 본 tab for the same space', () => {
  renderAt('/my-scraps');

  const savedTab = screen.getByRole('tab', { name: /저장\s+\d+/ });
  const recentTab = screen.getByRole('tab', { name: /최근 본\s+\d+/ });

  // eslint-disable-next-line testing-library/no-node-access -- closest('article') needed to scope within-card queries; no accessible article role available
  const moonOnSaved = screen.getByRole('link', { name: /^Moon 합주실 룸$/ }).closest('article');
  expect(moonOnSaved).toBeTruthy();
  fireEvent.click(within(moonOnSaved as HTMLElement).getByRole('button', { name: '스크랩 해제' }));

  expect(screen.queryByRole('link', { name: /^Moon 합주실 룸$/ })).not.toBeInTheDocument();
  expect(savedTab).toHaveAccessibleName(/저장\s+5/);

  fireEvent.click(recentTab);
  // eslint-disable-next-line testing-library/no-node-access -- closest('article') needed to scope within-card queries; no accessible article role available
  const moonOnRecent = screen.getByRole('link', { name: /^Moon 합주실 룸$/ }).closest('article');
  expect(within(moonOnRecent as HTMLElement).getByRole('button', { name: '스크랩' })).toBeInTheDocument();
});

test('support page switches between FAQ and 1:1 문의 tabs', () => {
  renderAt('/support');

  expect(screen.getByRole('heading', { level: 1, name: '고객센터' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'FAQ' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('공간은 어떻게 예약하나요?')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: '1:1 문의' }));
  expect(screen.getByRole('tab', { name: '1:1 문의' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('채팅에 답변이 계속 없어요.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '1:1 문의하기' })).toHaveAttribute('href', '/support/inquiry/new');
});

test('inquiry detail renders answered vs waiting states', () => {
  const view = render(
    <MemoryRouter initialEntries={['/support/inquiry/inq-1']}>
      <App />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { level: 1, name: '채팅에 답변이 계속 없어요.' })).toBeInTheDocument();
  expect(screen.getAllByText('답변완료').length).toBeGreaterThan(0);
  view.unmount();

  renderAt('/support/inquiry/inq-2');
  expect(screen.getByRole('heading', { level: 1, name: '해당 공간에 제대로 예약이 됐는지 확인하고 싶어요.' })).toBeInTheDocument();
  expect(screen.getByText('답변대기')).toBeInTheDocument();
});

test('terms page shows legal articles and switches to policy tab', () => {
  renderAt('/terms');

  expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /제 1조 \(목적\)/ })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: '이용정책' }));
  expect(screen.getByRole('heading', { name: /제 1조 \(이용정책의 목적\)/ })).toBeInTheDocument();
});

test('business apply page renders the three steps', () => {
  renderAt('/business/apply');

  expect(screen.getByText('Business')).toBeInTheDocument();
  expect(screen.getByText('업체 정보를 알려주세요.')).toBeInTheDocument();
  expect(screen.getByText('사업자 정보를 알려주세요.')).toBeInTheDocument();
  expect(screen.getByText('신청서 제출 후 관리자 검토 및 승인처리돼요.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '비즈니스 신청하러 가기' })).toBeInTheDocument();
});

test('notices page switches between 공지사항 and 이벤트 tabs', () => {
  renderAt('/notices');

  expect(screen.getByRole('heading', { level: 1, name: '공지사항/이벤트' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /개인정보 처리방침 개정안내/ })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: '이벤트' }));
  expect(screen.getByRole('tab', { name: '이벤트' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('link', { name: /내 공간 셀프캠 챌린지/ })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /개인정보 처리방침 개정안내/ })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('tab', { name: '종료' }));
  expect(screen.getByRole('link', { name: /밴더 소문내고 선물받기/ })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /내 공간 셀프캠 챌린지/ })).not.toBeInTheDocument();
});

test('notice detail falls back to a synthesized stub when the slug has no explicit detail', () => {
  renderAt('/notices/ios-update');

  expect(screen.getByRole('heading', { level: 1, name: 'iOS 오류 업데이트 안내' })).toBeInTheDocument();
  expect(screen.getByText(/상세 내용은 업데이트 예정입니다/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/notices');
});

test('notice detail renders body, winners, and navigates to list', () => {
  renderAt('/notices/refer-bander-gift');

  expect(screen.getByRole('heading', { level: 1, name: '밴더 소문내고 선물받기' })).toBeInTheDocument();
  expect(screen.getByText('종료')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '당첨자 발표' })).toBeInTheDocument();
  expect(screen.getByText('(1등) 해피트리')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute(
    'href',
    '/notices?tab=event',
  );
});

test('coupons page renders register form and filters owned coupons', () => {
  renderAt('/coupons');

  expect(screen.getByRole('heading', { level: 1, name: '쿠폰' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: '쿠폰등록' })).toBeInTheDocument();

  const input = screen.getByLabelText('쿠폰 코드') as HTMLInputElement;
  const registerBtn = screen.getByRole('button', { name: '등록' });
  expect(registerBtn).toBeDisabled();

  fireEvent.change(input, { target: { value: 'ABC-1234' } });
  expect(registerBtn).toBeEnabled();

  fireEvent.click(registerBtn);
  expect(screen.getByRole('status')).toHaveTextContent('ABC-1234');
  expect(input.value).toBe('');

  expect(screen.getAllByText('[유스뮤직 전용]').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('3,000원')).toBeInTheDocument();

  const usedTab = screen.getByRole('tab', { name: '사용완료' });
  fireEvent.click(usedTab);
  expect(usedTab).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('쿠폰이 없습니다.')).toBeInTheDocument();
});

test('points page shows coming soon state without dummy point history', () => {
  renderAt('/points');

  expect(screen.getByRole('heading', { level: 1, name: '포인트' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: '추후 추가 예정' })).toBeInTheDocument();
  expect(screen.getByText('포인트 기능은 준비 중입니다.')).toBeInTheDocument();
  expect(screen.queryByText('룸 예약 포인트 사용')).not.toBeInTheDocument();
  expect(screen.queryByText('회원가입 축하 포인트 지급')).not.toBeInTheDocument();
});

test('my scraps: scrapping in 최근 본 tab adds the space to the 저장 tab', () => {
  renderAt('/my-scraps');

  fireEvent.click(screen.getByRole('tab', { name: /최근 본\s+\d+/ }));

  // eslint-disable-next-line testing-library/no-node-access -- closest('article') needed to scope within-card queries; no accessible article role available
  const grooveArticle = screen.getByRole('link', { name: /^GROOVE$/ }).closest('article');
  fireEvent.click(within(grooveArticle as HTMLElement).getByRole('button', { name: '스크랩' }));

  const savedTab = screen.getByRole('tab', { name: /저장\s+\d+/ });
  expect(savedTab).toHaveAccessibleName(/저장\s+7/);

  fireEvent.click(savedTab);
  expect(screen.getByRole('link', { name: /^GROOVE$/ })).toBeInTheDocument();
});

test('renders the initial sign-up page before verification is requested', () => {
  renderAt('/signup');

  expect(
    screen.getByRole('heading', { name: '당신의 음악을, 당신의 공간에' })
  ).toBeInTheDocument();
  expect(screen.getByPlaceholderText('이메일을 입력해주세요.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '인증받기' })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText('인증번호를 입력해주세요.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
});

test('reveals the verification input and starts a countdown after requesting verification', async () => {
  renderAt('/signup');

  fireEvent.change(screen.getByLabelText('이메일'), {
    target: { value: 'bander@gmail.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: '인증받기' }));

  expect(await screen.findByRole('button', { name: '다시받기' })).toBeInTheDocument();
  expect(screen.getByPlaceholderText('인증번호를 입력해주세요.')).toBeInTheDocument();
  expect(screen.getByText(/0[45]:[0-5][0-9]/)).toBeInTheDocument();
});

test('activates the next button only after verification succeeds and passwords match', async () => {
  renderAt('/signup');

  fireEvent.change(screen.getByLabelText('이메일'), {
    target: { value: 'bander@gmail.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: '인증받기' }));
  expect(await screen.findByPlaceholderText('인증번호를 입력해주세요.')).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('인증번호를 입력해주세요.'), {
    target: { value: '123456' },
  });

  expect(await screen.findByText('인증완료')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();

  fireEvent.change(screen.getByLabelText('비밀번호'), {
    target: { value: 'abcd1234!' },
  });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 재입력해주세요.'), {
    target: { value: 'abcd1234!' },
  });

  expect(await screen.findByRole('button', { name: '다음' })).toBeEnabled();
});

test('moves to the step-2 profile page after a valid step-1 submit', async () => {
  renderAt('/signup');

  fireEvent.change(screen.getByLabelText('이메일'), {
    target: { value: 'bander@gmail.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: '인증받기' }));
  expect(await screen.findByPlaceholderText('인증번호를 입력해주세요.')).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText('인증번호를 입력해주세요.'), {
    target: { value: '123456' },
  });

  fireEvent.change(screen.getByLabelText('비밀번호'), {
    target: { value: 'abcd1234!' },
  });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 재입력해주세요.'), {
    target: { value: 'abcd1234!' },
  });

  await waitFor(() => expect(screen.getByRole('button', { name: '다음' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  await waitFor(() =>
    expect(window.sessionStorage.getItem('bander.signupDraft')).toContain('signup-token')
  );
  expect(await screen.findByLabelText('닉네임')).toHaveValue('활기찬다람쥐');
  expect(await screen.findByText('사용불가')).toBeInTheDocument();
  expect(screen.getByLabelText('프로필 사진 업로드')).toBeInTheDocument();
  expect(screen.getByText('서울특별시')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
});

test('starts new social users on the step-2 profile page with provider email as login id', async () => {
  const state = btoa(JSON.stringify({ provider: 'KAKAO', purpose: 'login', nonce: 'social-nonce' }));
  window.sessionStorage.setItem('bander.oauthState', state);

  renderAt(`/auth/callback?code=social-code&state=${encodeURIComponent(state)}`);

  expect(await screen.findByText('social@example.com')).toBeInTheDocument();
  expect(screen.getByLabelText('닉네임')).toHaveValue('소셜밴더');

  const draft = JSON.parse(window.sessionStorage.getItem('bander.signupDraft') ?? '{}');
  expect(draft.email).toBe('social@example.com');
  expect(draft.signupCompletionToken).toBe('social-signup-token');
  expect(draft.signupSource).toBe('SOCIAL');
});

test('allows selecting a korea region and uploading a profile image on step 2', async () => {
  seedSignupDraft();
  renderAt('/signup/profile');

  expect(await screen.findByLabelText('닉네임')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '사는 지역 (선택)' }));
  fireEvent.click(screen.getByRole('option', { name: '부산광역시' }));

  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
  const fileInput = screen.getByLabelText('프로필 사진 업로드') as HTMLInputElement;
  Object.defineProperty(fileInput, 'files', {
    configurable: true,
    value: [file],
  });
  fireEvent.change(fileInput);

  expect(screen.getByText('부산광역시')).toBeInTheDocument();
  expect(URL.createObjectURL).toHaveBeenCalledWith(file);
});

test('shows the updated password helper copy on the sign-up step-1 page', () => {
  renderAt('/signup');

  expect(screen.getByText('8자 이상 20자 이하로 입력해주세요.')).toBeInTheDocument();
  expect(screen.getByText('특수문자를 1개 이상 포함해주세요.')).toBeInTheDocument();
});

test('moves from step 2 to the terms page when profile inputs become valid', async () => {
  jest.useFakeTimers();
  seedSignupDraft();
  renderAt('/signup/profile');

  expect(await screen.findByLabelText('닉네임')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('닉네임'), {
    target: { value: '새로운밴더' },
  });

  await act(async () => {
    jest.advanceTimersByTime(300);
    await Promise.resolve();
  });

  expect(await screen.findByText('사용가능')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();

  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  expect(await screen.findByText('전체 약관 동의')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: '가입완료' })).toBeEnabled());
  expect(screen.getByText('서비스 이용약관 동의')).toBeInTheDocument();
  jest.useRealTimers();
});

test('submits signup completion and returns to login', async () => {
  seedSignupDraft({
    email: 'bander@gmail.com',
    gender: 'PREFER_NOT_TO_SAY',
    nickname: '새로운밴더',
    profileImageRef: 'profile/default-v1',
    regionCode: '서울특별시',
    signupCompletionToken: 'signup-token',
    verifiedEmailToken: 'verified-email-token',
  });

  renderAt('/signup/terms');

  expect(await screen.findByText('전체 약관 동의')).toBeInTheDocument();

  await waitFor(() =>
    expect(screen.getByRole('button', { name: '가입완료' })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole('button', { name: '가입완료' }));

  expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument();
});
