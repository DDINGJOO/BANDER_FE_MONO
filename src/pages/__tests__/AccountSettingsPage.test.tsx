import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountSettingsPage } from '../AccountSettingsPage';
import * as marketingApi from '../../api/marketing-consent';
import * as usersApi from '../../api/users';
import * as socialApi from '../../api/social';


jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeFooter', () => ({
  HomeFooter: () => <div data-testid="home-footer" />,
}));

jest.mock('../../components/account/ChangePasswordModal', () => ({
  ChangePasswordModal: () => <div data-testid="change-password-modal" />,
}));

jest.mock('../../api/marketing-consent', () => ({
  getMarketingConsent: jest.fn(),
  updateMarketingConsent: jest.fn(),
}));

jest.mock('../../api/users', () => ({
  getMyAccount: jest.fn(),
  deactivateAccount: jest.fn(),
}));

jest.mock('../../api/social', () => ({
  getLinkedProviders: jest.fn(),
  socialUnlink: jest.fn(),
}));

jest.mock('../../api/phone', () => ({
  sendPhoneCode: jest.fn(),
  verifyPhoneCode: jest.fn(),
  updatePhone: jest.fn(),
}));

jest.mock('../../config/oauth', () => ({
  startOAuth: jest.fn(),
}));

const mockedGetMarketingConsent = jest.mocked(marketingApi.getMarketingConsent);
const mockedUpdateMarketingConsent = jest.mocked(marketingApi.updateMarketingConsent);
const mockedGetMyAccount = jest.mocked(usersApi.getMyAccount);
const mockedGetLinkedProviders = jest.mocked(socialApi.getLinkedProviders);

const DEFAULT_CONSENT_VIEW: marketingApi.MarketingConsentView = {
  granted: false,
  nightGranted: false,
  grantedAt: null,
  withdrawnAt: null,
  nightConsentAt: null,
  nightWithdrawnAt: null,
  lastReconfirmedAt: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AccountSettingsPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  jest.useFakeTimers();
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
  mockedGetMyAccount.mockResolvedValue({
    email: 'test@example.com',
    phoneVerified: false,
    phoneMasked: null,
  } as any);
  mockedGetLinkedProviders.mockResolvedValue({ providers: [] } as any);
});

afterEach(() => {
  jest.useRealTimers();
});

test('mount 시 GET 호출 후 marketingOptIn 초기화', async () => {
  mockedGetMarketingConsent.mockResolvedValue({ ...DEFAULT_CONSENT_VIEW, granted: true });

  renderPage();

  const toggle = screen.getByRole('button', { name: '마케팅 정보 수신 동의' });
  expect(toggle).toBeDisabled();

  await waitFor(() => {
    expect(toggle).not.toBeDisabled();
  });

  expect(mockedGetMarketingConsent).toHaveBeenCalledTimes(1);
  expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('토글 클릭 시 optimistic update 후 PATCH 호출', async () => {
  mockedGetMarketingConsent.mockResolvedValue({ ...DEFAULT_CONSENT_VIEW, granted: false });
  mockedUpdateMarketingConsent.mockResolvedValue({ ...DEFAULT_CONSENT_VIEW, granted: true });

  renderPage();

  const toggle = screen.getByRole('button', { name: '마케팅 정보 수신 동의' });
  await waitFor(() => expect(toggle).not.toBeDisabled());

  expect(toggle).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(toggle);

  // optimistic update: immediately reflects next state
  expect(toggle).toHaveAttribute('aria-pressed', 'true');

  // advance debounce timer
  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  await waitFor(() => {
    expect(mockedUpdateMarketingConsent).toHaveBeenCalledWith({ granted: true });
  });

  expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('PATCH 실패 시 rollback + 에러 메시지 표시', async () => {
  mockedGetMarketingConsent.mockResolvedValue({ ...DEFAULT_CONSENT_VIEW, granted: true });
  mockedUpdateMarketingConsent.mockRejectedValue(new Error('서버 오류'));

  renderPage();

  const toggle = screen.getByRole('button', { name: '마케팅 정보 수신 동의' });
  await waitFor(() => expect(toggle).not.toBeDisabled());

  expect(toggle).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(toggle);

  // optimistic: toggled to false
  expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  await waitFor(() => {
    expect(screen.getByText('변경 실패. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  // rolled back to original
  expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('GET 중(loading) 토글 disabled', () => {
  // getMarketingConsent never resolves during this test
  mockedGetMarketingConsent.mockReturnValue(new Promise(() => {}));

  renderPage();

  const toggle = screen.getByRole('button', { name: '마케팅 정보 수신 동의' });
  expect(toggle).toBeDisabled();
});

test('GET 실패 시 에러 메시지 표시 + fallback false', async () => {
  mockedGetMarketingConsent.mockRejectedValue(new Error('network error'));

  renderPage();

  await waitFor(() => {
    expect(screen.getByText('마케팅 동의 상태를 불러오지 못했습니다.')).toBeInTheDocument();
  });

  const toggle = screen.getByRole('button', { name: '마케팅 정보 수신 동의' });
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(toggle).not.toBeDisabled();
});
