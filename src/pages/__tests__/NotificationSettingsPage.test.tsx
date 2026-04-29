import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationSettingsPage } from '../NotificationSettingsPage';
import * as prefApi from '../../api/notification-preferences';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeFooter', () => ({
  HomeFooter: () => <div data-testid="home-footer" />,
}));

jest.mock('../../api/notification-preferences', () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

const mockedGet = jest.mocked(prefApi.getNotificationPreferences);
const mockedUpdate = jest.mocked(prefApi.updateNotificationPreferences);

const DEFAULT_VIEW: prefApi.NotificationPreferencesView = {
  interestAppPush: true,
  communityAppPush: true,
  updatedAt: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <NotificationSettingsPage />
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
});

afterEach(() => {
  jest.useRealTimers();
});

test('mount 시 GET 호출 후 관심/커뮤니티 토글 초기화', async () => {
  mockedGet.mockResolvedValue({ ...DEFAULT_VIEW, interestAppPush: false, communityAppPush: true });

  renderPage();

  const interestToggle = screen.getByRole('switch', { name: /관심 알림/ });
  const communityToggle = screen.getByRole('switch', { name: /커뮤니티 알림/ });

  // loading 중 disabled
  expect(interestToggle).toBeDisabled();
  expect(communityToggle).toBeDisabled();

  await waitFor(() => expect(interestToggle).not.toBeDisabled());

  expect(mockedGet).toHaveBeenCalledTimes(1);
  expect(interestToggle).toHaveAttribute('aria-checked', 'false');
  expect(communityToggle).toHaveAttribute('aria-checked', 'true');
});

test('관심 토글 클릭 → PATCH({interestAppPush: false}) + optimistic update', async () => {
  mockedGet.mockResolvedValue({ ...DEFAULT_VIEW, interestAppPush: true, communityAppPush: true });
  mockedUpdate.mockResolvedValue({ ...DEFAULT_VIEW, interestAppPush: false, communityAppPush: true });

  renderPage();

  const interestToggle = screen.getByRole('switch', { name: /관심 알림/ });
  await waitFor(() => expect(interestToggle).not.toBeDisabled());

  expect(interestToggle).toHaveAttribute('aria-checked', 'true');

  fireEvent.click(interestToggle);

  // optimistic: 즉시 false 로
  expect(interestToggle).toHaveAttribute('aria-checked', 'false');

  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  await waitFor(() => {
    expect(mockedUpdate).toHaveBeenCalledWith({ interestAppPush: false });
  });

  expect(interestToggle).toHaveAttribute('aria-checked', 'false');
});

test('커뮤니티 토글 클릭 → PATCH({communityAppPush: false}) + optimistic update', async () => {
  mockedGet.mockResolvedValue({ ...DEFAULT_VIEW, interestAppPush: true, communityAppPush: true });
  mockedUpdate.mockResolvedValue({ ...DEFAULT_VIEW, interestAppPush: true, communityAppPush: false });

  renderPage();

  const communityToggle = screen.getByRole('switch', { name: /커뮤니티 알림/ });
  await waitFor(() => expect(communityToggle).not.toBeDisabled());

  expect(communityToggle).toHaveAttribute('aria-checked', 'true');

  fireEvent.click(communityToggle);

  // optimistic: 즉시 false 로
  expect(communityToggle).toHaveAttribute('aria-checked', 'false');

  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  await waitFor(() => {
    expect(mockedUpdate).toHaveBeenCalledWith({ communityAppPush: false });
  });

  expect(communityToggle).toHaveAttribute('aria-checked', 'false');
});

test('PATCH 실패 시 관심 롤백 + 에러 메시지 표시', async () => {
  mockedGet.mockResolvedValue({ ...DEFAULT_VIEW, interestAppPush: true, communityAppPush: true });
  mockedUpdate.mockRejectedValue(new Error('서버 오류'));

  renderPage();

  const interestToggle = screen.getByRole('switch', { name: /관심 알림/ });
  await waitFor(() => expect(interestToggle).not.toBeDisabled());

  fireEvent.click(interestToggle);

  // optimistic: false
  expect(interestToggle).toHaveAttribute('aria-checked', 'false');

  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  await waitFor(() => {
    expect(screen.getByText('변경 실패. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  // 롤백: 원래 true 로 복원
  expect(interestToggle).toHaveAttribute('aria-checked', 'true');
});

test('PATCH 실패 시 커뮤니티 롤백 + 에러 메시지 표시', async () => {
  mockedGet.mockResolvedValue({ ...DEFAULT_VIEW, interestAppPush: true, communityAppPush: true });
  mockedUpdate.mockRejectedValue(new Error('서버 오류'));

  renderPage();

  const communityToggle = screen.getByRole('switch', { name: /커뮤니티 알림/ });
  await waitFor(() => expect(communityToggle).not.toBeDisabled());

  fireEvent.click(communityToggle);

  // optimistic: false
  expect(communityToggle).toHaveAttribute('aria-checked', 'false');

  await act(async () => {
    jest.advanceTimersByTime(300);
  });

  await waitFor(() => {
    expect(screen.getByText('변경 실패. 잠시 후 다시 시도해주세요.')).toBeInTheDocument();
  });

  // 롤백: 원래 true 로 복원
  expect(communityToggle).toHaveAttribute('aria-checked', 'true');
});

test('GET 실패 시 fallback (true/true) + 에러 메시지 표시', async () => {
  mockedGet.mockRejectedValue(new Error('network error'));

  renderPage();

  await waitFor(() => {
    expect(screen.getByText('알림 설정을 불러오지 못했습니다.')).toBeInTheDocument();
  });

  const interestToggle = screen.getByRole('switch', { name: /관심 알림/ });
  const communityToggle = screen.getByRole('switch', { name: /커뮤니티 알림/ });

  // fallback default: true/true
  expect(interestToggle).toHaveAttribute('aria-checked', 'true');
  expect(communityToggle).toHaveAttribute('aria-checked', 'true');
  expect(interestToggle).not.toBeDisabled();
  expect(communityToggle).not.toBeDisabled();
});

test('GET 로딩 중 관심/커뮤니티 토글 disabled', () => {
  // getNotificationPreferences never resolves during this test
  mockedGet.mockReturnValue(new Promise(() => {}));

  renderPage();

  const interestToggle = screen.getByRole('switch', { name: /관심 알림/ });
  const communityToggle = screen.getByRole('switch', { name: /커뮤니티 알림/ });

  expect(interestToggle).toBeDisabled();
  expect(communityToggle).toBeDisabled();
});
