import React from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../shared/BrandMark';
import {
  ChevronIcon,
  HeaderAlarmIcon,
  HeaderCartIcon,
  HeaderWishlistIcon,
  SearchIcon,
} from '../shared/Icons';

type HomeHeaderSharedProps = {
  authenticated: boolean;
  onGuestCta: () => void;
};

export type HomeHeaderSearchBarProps = HomeHeaderSharedProps & {
  variant?: 'bar';
  filteredSuggestions: string[];
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onSearchFocus: () => void;
  onSearchSubmit: (value: string) => void;
  onSuggestionSelect: (value: string) => void;
  searchOpen: boolean;
  searchQuery: string;
  searchRef: React.RefObject<HTMLDivElement | null>;
};

export type HomeHeaderSearchIconProps = HomeHeaderSharedProps & {
  variant: 'icon';
};

export type HomeHeaderProps = HomeHeaderSearchBarProps | HomeHeaderSearchIconProps;

function isSearchBar(props: HomeHeaderProps): props is HomeHeaderSearchBarProps {
  return props.variant !== 'icon';
}

export function HomeHeader(props: HomeHeaderProps) {
  const { authenticated, onGuestCta } = props;
  const bar = isSearchBar(props);

  return (
    <header className={`home-header ${authenticated ? 'home-header--authenticated' : ''}`}>
      <Link className="home-header__register-pill" to={{ hash: 'spaces', pathname: '/' }}>
        공간 등록하기
      </Link>
      <div className={`home-header__inner ${authenticated ? 'home-header__inner--authenticated' : ''}`}>
        <div className={`home-header__main ${authenticated ? 'home-header__main--authenticated' : ''}`}>
          <BrandMark compact />

          {bar ? (
            <div className="home-header__search" ref={props.searchRef}>
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
                    props.onSearchChange(event.target.value);
                  }}
                  onFocus={props.onSearchFocus}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      props.onSearchSubmit(props.searchQuery);
                    }
                  }}
                  placeholder="공간, 업체, 커뮤니티 검색"
                  value={props.searchQuery}
                />
                <div className="home-header__search-actions">
                  {props.searchQuery ? (
                    <button
                      aria-label="검색어 지우기"
                      className="home-header__search-clear"
                      onClick={props.onSearchClear}
                      type="button"
                    >
                      ×
                    </button>
                  ) : null}
                  {authenticated ? (
                    <button
                      aria-label="헤더 검색 실행"
                      className="home-header__search-submit"
                      onClick={() => props.onSearchSubmit(props.searchQuery)}
                      type="button"
                    >
                      <SearchIcon />
                    </button>
                  ) : null}
                </div>
              </div>

              {props.searchOpen && props.searchQuery ? (
                <div className="home-header__search-menu">
                  {props.filteredSuggestions.map((item) => {
                    const [prefix, suffix] = item.split(props.searchQuery);

                    return (
                      <button
                        className="home-header__search-option"
                        key={item}
                        onClick={() => props.onSuggestionSelect(item)}
                        type="button"
                      >
                        <span>{prefix ?? ''}</span>
                        <span className="home-header__search-highlight">{props.searchQuery}</span>
                        <span>{suffix ?? ''}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="home-header__search home-header__search--icon">
              <Link aria-label="공간 검색" className="home-header__search-icon-link" to="/search">
                <SearchIcon />
              </Link>
            </div>
          )}

          <nav className={`home-header__nav ${authenticated ? 'home-header__nav--authenticated' : ''}`}>
            {authenticated ? (
              <>
                <Link to={{ hash: 'community', pathname: '/' }}>커뮤니티</Link>
                <Link to="/search">탐색</Link>
                <Link className="home-header__reservation-link" to={{ hash: 'reservation', pathname: '/' }}>
                  <span>예약</span>
                  <span className="home-header__reservation-badge">3</span>
                </Link>
              </>
            ) : (
              <>
                <Link to={{ hash: 'hot-posts', pathname: '/' }}>커뮤니티</Link>
                <Link to={{ hash: 'spaces', pathname: '/' }}>탐색</Link>
                <Link to={{ hash: 'reviews', pathname: '/' }}>테다</Link>
              </>
            )}
          </nav>
        </div>

        {authenticated ? (
          <div className="home-header__auth-actions">
            <button aria-label="장바구니" className="home-header__icon-button home-header__icon-button--cart" type="button">
              <HeaderCartIcon />
              <span className="home-header__icon-badge">8</span>
            </button>
            <button aria-label="찜 목록" className="home-header__icon-button" type="button">
              <HeaderWishlistIcon />
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
