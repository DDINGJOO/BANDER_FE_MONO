import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeHeader, type HomeHeaderSearchBarProps } from '../HomeHeader';

jest.mock('../../shared/Icons', () => ({
  ChevronIcon: () => <span aria-hidden="true" data-testid="chevron-icon" />,
  HeaderAlarmIcon: () => <span aria-hidden="true" data-testid="alarm-icon" />,
  HeaderChatIcon: () => <span aria-hidden="true" data-testid="chat-icon" />,
  HeaderWishlistIcon: () => <span aria-hidden="true" data-testid="wishlist-icon" />,
  SearchIcon: () => <span aria-hidden="true" data-testid="search-icon" />,
}));

function renderGuestHeader(overrides: Partial<HomeHeaderSearchBarProps> = {}) {
  const props: HomeHeaderSearchBarProps = {
    authenticated: false,
    filteredSuggestions: [],
    onSearchChange: jest.fn(),
    onSearchClear: jest.fn(),
    onSearchFocus: jest.fn(),
    onSearchSubmit: jest.fn(),
    onSuggestionSelect: jest.fn(),
    searchOpen: false,
    searchQuery: '바인드',
    searchRef: { current: null },
    ...overrides,
  };

  render(
    <MemoryRouter>
      <HomeHeader {...props} />
    </MemoryRouter>,
  );

  return props;
}

test('비로그인 헤더 탐색 링크도 지도 검색으로 이동한다', () => {
  renderGuestHeader();

  expect(screen.getByRole('link', { name: '탐색' })).toHaveAttribute('href', '/search/map');
});

test('비로그인 헤더 검색창도 같은 형태로 검색 실행 버튼을 제공한다', () => {
  const onSearchSubmit = jest.fn();
  renderGuestHeader({ onSearchSubmit });

  const input = screen.getByPlaceholderText('공간, 업체, 커뮤니티 검색');
  expect(input.closest('.home-header__search-field')).toHaveClass('home-header__search-field--with-submit');

  fireEvent.click(screen.getByRole('button', { name: '헤더 검색 실행' }));
  expect(onSearchSubmit).toHaveBeenCalledWith('바인드');
});
