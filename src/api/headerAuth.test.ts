import { getJson } from './client';
import { fetchUnreadNotificationCount } from './notifications';
import { getMySummary } from './users';

jest.mock('./client', () => ({
  getJson: jest.fn(),
  patchJson: jest.fn(),
  postJson: jest.fn(),
  requestVoid: jest.fn(),
}));

const mockedGetJson = getJson as jest.MockedFunction<typeof getJson>;

beforeEach(() => {
  mockedGetJson.mockResolvedValue({} as never);
});

test('my summary lookup does not clear auth on a header-only 401', () => {
  getMySummary();

  expect(mockedGetJson).toHaveBeenCalledWith('/api/v1/users/me/summary', {
    preserveAuthOnUnauthorized: true,
  });
});

test('unread notification badge lookup does not clear auth on a header-only 401', () => {
  fetchUnreadNotificationCount();

  expect(mockedGetJson).toHaveBeenCalledWith('/api/v1/notifications/unread-count', {
    preserveAuthOnUnauthorized: true,
  });
});
