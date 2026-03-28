import React from 'react';
import { BrandMark } from '../shared/BrandMark';
import {
  ChevronIcon,
  HeaderAlarmIcon,
  HeaderBookmarkIcon,
  HeaderChatIcon,
  SearchIcon,
} from '../shared/Icons';

type HomeHeaderProps = {
  authenticated: boolean;
  filteredSuggestions: string[];
  onGuestCta: () => void;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchFocus: () => void;
  onSearchSubmit: (value: string) => void;
  onSuggestionSelect: (value: string) => void;
  searchOpen: boolean;
  searchQuery: string;
  searchRef: React.RefObject<HTMLDivElement | null>;
};

export function HomeHeader({
  authenticated,
  filteredSuggestions,
  onGuestCta,
  onSearchChange,
  onSearchClear,
  onSearchFocus,
  onSearchSubmit,
  onSuggestionSelect,
  searchOpen,
  searchQuery,
  searchRef,
}: HomeHeaderProps) {
  return (
    <header className={`home-header ${authenticated ? 'home-header--authenticated' : ''}`}>
      <div className={`home-header__inner ${authenticated ? 'home-header__inner--authenticated' : ''}`}>
        <div className={`home-header__main ${authenticated ? 'home-header__main--authenticated' : ''}`}>
          <BrandMark compact />

          <div className="home-header__search" ref={searchRef}>
            <div
              className={
                authenticated
                  ? 'home-header__search-field home-header__search-field--authenticated'
                  : 'home-header__search-field'
              }
            >
              {authenticated ? null : <SearchIcon />}
              <input
                className="home-header__search-input"
                onChange={(event) => {
                  onSearchChange(event.target.value);
                }}
                onFocus={onSearchFocus}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onSearchSubmit(searchQuery);
                  }
                }}
                placeholder="공간, 업체, 커뮤니티 검색"
                value={searchQuery}
              />
              <div className="home-header__search-actions">
                {searchQuery ? (
                  <button
                    aria-label="검색어 지우기"
                    className="home-header__search-clear"
                    onClick={onSearchClear}
                    type="button"
                  >
                    ×
                  </button>
                ) : null}
                {authenticated ? (
                  <button
                    aria-label="헤더 검색 실행"
                    className="home-header__search-submit"
                    onClick={() => onSearchSubmit(searchQuery)}
                    type="button"
                  >
                    <SearchIcon />
                  </button>
                ) : null}
              </div>
            </div>

            {searchOpen && searchQuery ? (
              <div className="home-header__search-menu">
                {filteredSuggestions.map((item) => {
                  const [prefix, suffix] = item.split(searchQuery);

                  return (
                    <button
                      className="home-header__search-option"
                      key={item}
                      onClick={() => onSuggestionSelect(item)}
                      type="button"
                    >
                      <span>{prefix ?? ''}</span>
                      <span className="home-header__search-highlight">{searchQuery}</span>
                      <span>{suffix ?? ''}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <nav className={`home-header__nav ${authenticated ? 'home-header__nav--authenticated' : ''}`}>
            {authenticated ? (
              <>
                <a href="#community">커뮤니티</a>
                <a href="#spaces">탐색</a>
                <a className="home-header__reservation-link" href="#reservation">
                  <span>예약</span>
                  <span className="home-header__reservation-badge">3</span>
                </a>
              </>
            ) : (
              <>
                <a href="#hot-posts">게시글</a>
                <a href="#spaces">공간찾기</a>
                <a href="#reviews">후기</a>
              </>
            )}
          </nav>
        </div>

        {authenticated ? (
          <div className="home-header__auth-actions">
            <button aria-label="스크랩" className="home-header__icon-button" type="button">
              <HeaderBookmarkIcon />
            </button>
            <button aria-label="채팅" className="home-header__icon-button" type="button">
              <HeaderChatIcon />
            </button>
            <button
              aria-label="알림"
              className="home-header__icon-button home-header__icon-button--alert"
              type="button"
            >
              <HeaderAlarmIcon />
            </button>
            <button aria-label="프로필 메뉴" className="home-header__profile" type="button">
              <span aria-hidden="true" className="home-header__avatar" />
              <span aria-hidden="true" className="home-header__profile-arrow">
                <ChevronIcon />
              </span>
            </button>
          </div>
        ) : (
          <div className="home-header__actions">
            <button className="home-header__button" onClick={onGuestCta} type="button">
              로그인/회원가입
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
