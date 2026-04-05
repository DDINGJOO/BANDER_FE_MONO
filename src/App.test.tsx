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

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => 'blob:profile-preview');
  URL.revokeObjectURL = jest.fn();
});

beforeEach(() => {
  window.sessionStorage.clear();
  global.fetch = jest.fn();
  (global.fetch as jest.Mock).mockImplementation(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? 'GET';

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

test('renders my mini-feed page', () => {
  renderAt('/my-minifeed');

  expect(screen.getByRole('heading', { level: 1, name: '내 미니피드' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '작성한 글' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByText('5개의 게시글')).toBeInTheDocument();
});

test('my mini-feed commented tab matches Figma (6419:81316)', () => {
  renderAt('/my-minifeed?tab=commented');

  expect(screen.getByRole('tab', { name: '댓글단 글' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: '작성한 글' })).toHaveAttribute('aria-selected', 'false');
  expect(screen.getByText('5개의 게시글')).toBeInTheDocument();
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

test('renders the community post detail page for a demo slug', () => {
  renderAt('/community/post/vocal-effector-help');

  expect(
    screen.getByRole('heading', { level: 1, name: '보컬용 이펙터 추천 좀 해주세요!' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '댓글 5' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '목록으로' })).toHaveAttribute('href', '/community');
});

test('community post detail opens reply-delete modal and decrements count on confirm', () => {
  renderAt('/community/post/vocal-effector-help');

  fireEvent.click(screen.getAllByRole('button', { name: '답글 삭제' })[0]);

  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(screen.getByText('해당 답글을 삭제하시겠어요?')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '삭제' }));

  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '댓글 4' })).toBeInTheDocument();
});

test('community post detail opens post report confirm then report modal from 게시글 신고', () => {
  renderAt('/community/post/vocal-effector-help');

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

test('community post detail opens report modal from comment 신고하기', () => {
  renderAt('/community/post/vocal-effector-help');

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
  expect(screen.getByText('4개의 공간')).toBeInTheDocument();
});

test('switches search result tabs and opens the community sort menu', async () => {
  renderAt('/search?q=합주');

  fireEvent.click(screen.getByRole('button', { name: '업체' }));
  expect(screen.getByText('3개의 업체')).toBeInTheDocument();
  expect(screen.getByText('유스뮤직')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '커뮤니티' }));
  expect(screen.getByText('7개의 게시글')).toBeInTheDocument();
  expect(screen.getByText('서울 지역 연습실습실 가격 비교 정리했습니다 🎵')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '최신순' }));
  expect(screen.getByRole('button', { name: '좋아요 많은 순' })).toBeInTheDocument();
});

test('moves to the room detail page when clicking a space card', async () => {
  renderAt('/search?q=합주');

  fireEvent.click(screen.getByText('A룸 그랜드 피아노 대관').closest('a') as HTMLAnchorElement);

  expect(
    await screen.findByRole('heading', { level: 1, name: 'A룸 그랜드 피아노 대관' })
  ).toBeInTheDocument();
  expect(screen.getAllByText('업비트스튜디오').length).toBeGreaterThanOrEqual(1);
  expect(screen.getByText('업체 정보')).toBeInTheDocument();
  expect(screen.getByText(/휴대폰 본인인증이 필요해요/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '본인인증 미완료' }));

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
  await waitFor(() => expect(screen.getByText('사용불가')).toBeInTheDocument());
  expect(screen.getByLabelText('프로필 사진 업로드')).toBeInTheDocument();
  expect(screen.getByText('서울특별시')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
});

test('allows selecting a korea region and uploading a profile image on step 2', async () => {
  seedSignupDraft();
  renderAt('/signup/profile');

  expect(await screen.findByLabelText('닉네임')).toBeInTheDocument();

  fireEvent.click(screen.getByText('서울특별시').closest('button') as HTMLButtonElement);
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

  await waitFor(() => expect(screen.getByText('사용가능')).toBeInTheDocument());
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
