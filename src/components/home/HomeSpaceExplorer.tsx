import React, { useEffect, useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { HomeSpaceCard } from './HomeSpaceCard';
import { ChevronIcon, SearchIcon, SelectedCheckIcon } from '../shared/Icons';
import {
  HOME_FILTER_KEYWORD_GROUPS,
  HOME_FILTER_REGION_COLUMNS,
  HOME_FILTER_REGION_DISTRICTS,
  HOME_FILTER_SPACE_OPTIONS,
  HOME_SPACE_CARDS,
} from '../../data/home';

type ExplorerPanel = 'date' | 'keyword' | 'people' | 'region' | 'space' | null;
type ExplorerVariant = 'hero' | 'section';

type DateDraft = {
  day: number;
  endHour: number;
  startHour: number;
};

type HomeSpaceExplorerProps = {
  variant?: ExplorerVariant;
};

const DEFAULT_DATE_DRAFT: DateDraft = {
  day: 13,
  endHour: 24,
  startHour: 0,
};

const CALENDAR_CELLS = [
  { day: 27, key: 'prev-27', outside: true },
  { day: 28, key: 'prev-28', outside: true },
  { day: 29, key: 'prev-29', outside: true },
  { day: 30, key: 'prev-30', outside: true },
  { day: 31, key: 'prev-31', outside: true },
  ...Array.from({ length: 31 }, (_, index) => ({
    day: index + 1,
    key: `current-${index + 1}`,
    outside: false,
  })),
  { day: 1, key: 'next-1', outside: true },
  { day: 2, key: 'next-2', outside: true },
  { day: 3, key: 'next-3', outside: true },
  { day: 4, key: 'next-4', outside: true },
  { day: 5, key: 'next-5', outside: true },
  { day: 6, key: 'next-6', outside: true },
];

function toggleSelection(list: string[], value: string) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }

  return [...list, value];
}

function findProvinceSelection(selections: string[], provinces: readonly string[]) {
  return (
    provinces.find((province) =>
      HOME_FILTER_REGION_DISTRICTS[province]?.some((district) => selections.includes(district))
    ) ?? null
  );
}

function summarizeSelection(values: string[], emptyLabel: string) {
  if (values.length === 0) {
    return emptyLabel;
  }

  if (values.length === 1) {
    return values[0];
  }

  return `${values[0]} 외 ${values.length - 1}`;
}

export function HomeSpaceExplorer({ variant = 'section' }: HomeSpaceExplorerProps) {
  const isHero = variant === 'hero';
  const explorerRef = useRef<HTMLDivElement | null>(null);
  const [openPanel, setOpenPanel] = useState<ExplorerPanel>(null);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [reservableOnly, setReservableOnly] = useState(false);
  const [parkingOnly, setParkingOnly] = useState(false);

  const [appliedRegionSelections, setAppliedRegionSelections] = useState<string[]>([]);
  const [draftRegionSelections, setDraftRegionSelections] = useState<string[]>([]);
  const [leftProvince, setLeftProvince] = useState<string | null>(null);
  const [rightProvince, setRightProvince] = useState<string | null>(null);

  const [appliedSpaceSelections, setAppliedSpaceSelections] = useState<string[]>([]);
  const [draftSpaceSelections, setDraftSpaceSelections] = useState<string[]>([]);

  const [appliedKeywordSelections, setAppliedKeywordSelections] = useState<string[]>([]);
  const [draftKeywordSelections, setDraftKeywordSelections] = useState<string[]>([]);

  const [appliedPeopleCount, setAppliedPeopleCount] = useState(0);
  const [draftPeopleCount, setDraftPeopleCount] = useState(0);

  const [appliedDate, setAppliedDate] = useState<DateDraft | null>(null);
  const [draftDate, setDraftDate] = useState<DateDraft>(DEFAULT_DATE_DRAFT);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (!explorerRef.current?.contains(target)) {
        setOpenPanel(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const openRegionPanel = () => {
    if (openPanel === 'region') {
      setOpenPanel(null);
      return;
    }

    setDraftRegionSelections(appliedRegionSelections);
    setLeftProvince(findProvinceSelection(appliedRegionSelections, HOME_FILTER_REGION_COLUMNS.left));
    setRightProvince(findProvinceSelection(appliedRegionSelections, HOME_FILTER_REGION_COLUMNS.right));
    setOpenPanel('region');
  };

  const openSpacePanel = () => {
    if (openPanel === 'space') {
      setOpenPanel(null);
      return;
    }

    setDraftSpaceSelections(appliedSpaceSelections);
    setOpenPanel('space');
  };

  const openDatePanel = () => {
    if (openPanel === 'date') {
      setOpenPanel(null);
      return;
    }

    setDraftDate(appliedDate ?? DEFAULT_DATE_DRAFT);
    setOpenPanel('date');
  };

  const openPeoplePanel = () => {
    if (openPanel === 'people') {
      setOpenPanel(null);
      return;
    }

    setDraftPeopleCount(appliedPeopleCount);
    setOpenPanel('people');
  };

  const openKeywordPanel = () => {
    if (openPanel === 'keyword') {
      setOpenPanel(null);
      return;
    }

    setDraftKeywordSelections(appliedKeywordSelections);
    setOpenPanel('keyword');
  };

  const handleDateRangeChange = (nextValue: number[]) => {
    const [startHour, endHour] = nextValue;
    setDraftDate((current) => ({
      ...current,
      endHour,
      startHour,
    }));
  };

  const clearRegionFilter = () => {
    setAppliedRegionSelections([]);
    setDraftRegionSelections([]);
    setLeftProvince(null);
    setRightProvince(null);
    setOpenPanel(null);
  };

  const clearSpaceFilter = () => {
    setAppliedSpaceSelections([]);
    setDraftSpaceSelections([]);
    setOpenPanel(null);
  };

  const clearKeywordFilter = () => {
    setAppliedKeywordSelections([]);
    setDraftKeywordSelections([]);
    setOpenPanel(null);
  };

  const clearPeopleFilter = () => {
    setAppliedPeopleCount(0);
    setDraftPeopleCount(0);
    setOpenPanel(null);
  };

  const clearDateFilter = () => {
    setAppliedDate(null);
    setDraftDate(DEFAULT_DATE_DRAFT);
    setOpenPanel(null);
  };

  const dateButtonLabel = appliedDate
    ? `25.08.${String(appliedDate.day).padStart(2, '0')} / ${appliedDate.startHour}시 ~ ${appliedDate.endHour}시`
    : isHero
      ? '25.08.13 / 0시 ~ 24시'
      : '날짜/시간';
  const peopleButtonLabel = appliedPeopleCount > 0 ? `${appliedPeopleCount}명` : '인원';
  const regionButtonLabel = summarizeSelection(appliedRegionSelections, '지역');
  const spaceButtonLabel = summarizeSelection(appliedSpaceSelections, '공간');
  const keywordButtonLabel =
    appliedKeywordSelections.length > 0 ? `키워드 ${appliedKeywordSelections.length}` : '키워드';

  const hasActiveRegion = appliedRegionSelections.length > 0;
  const hasActiveSpace = appliedSpaceSelections.length > 0;
  const hasActiveKeyword = appliedKeywordSelections.length > 0;
  const hasActiveDate = Boolean(appliedDate);
  const hasActivePeople = appliedPeopleCount > 0;

  const renderRegionColumn = (
    provinces: readonly string[],
    activeProvince: string | null,
    onProvinceChange: (province: string | null) => void
  ) => {
    if (!activeProvince) {
      return (
        <div className="home-explorer-region__list">
          {provinces.map((province) => (
            <button
              className="home-explorer-region__province"
              key={province}
              onClick={() => onProvinceChange(province)}
              type="button"
            >
              <span>{province}</span>
              <ChevronIcon />
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="home-explorer-region__details">
        <button
          className="home-explorer-region__province home-explorer-region__province--active"
          onClick={() => onProvinceChange(null)}
          type="button"
        >
          <span>{activeProvince}</span>
          <ChevronIcon />
        </button>
        <div className="home-explorer-region__districts">
          {HOME_FILTER_REGION_DISTRICTS[activeProvince].map((district) => {
            const selected = draftRegionSelections.includes(district);

            return (
              <button
                className={`home-explorer-region__district ${selected ? 'home-explorer-region__district--selected' : ''}`}
                key={district}
                onClick={() => setDraftRegionSelections((current) => toggleSelection(current, district))}
                type="button"
              >
                <span>{district}</span>
                {selected ? <SelectedCheckIcon /> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const regionPanel = (
    <div className="home-explorer-panel home-explorer-panel--region">
      <div className="home-explorer-panel__header">
        <span>지역</span>
        <button className="home-explorer-panel__close" onClick={() => setOpenPanel(null)} type="button">
          ×
        </button>
      </div>
      <div className="home-explorer-panel__body home-explorer-panel__body--region">
        <div className="home-explorer-region__columns">
          {renderRegionColumn(HOME_FILTER_REGION_COLUMNS.left, leftProvince, setLeftProvince)}
          <div className="home-explorer-region__divider" />
          {renderRegionColumn(HOME_FILTER_REGION_COLUMNS.right, rightProvince, setRightProvince)}
        </div>
      </div>
      <div className="home-explorer-panel__footer">
        <button
          className="home-explorer-panel__action home-explorer-panel__action--ghost"
          onClick={() => {
            setDraftRegionSelections([]);
            setLeftProvince(null);
            setRightProvince(null);
          }}
          type="button"
        >
          초기화
        </button>
        <button
          className="home-explorer-panel__action"
          disabled={draftRegionSelections.length === 0}
          onClick={() => {
            setAppliedRegionSelections(draftRegionSelections);
            setOpenPanel(null);
          }}
          type="button"
        >
          선택완료
        </button>
      </div>
    </div>
  );

  const spacePanel = (
    <div className="home-explorer-panel home-explorer-panel--space">
      <div className="home-explorer-panel__header">
        <span>공간</span>
        <button className="home-explorer-panel__close" onClick={() => setOpenPanel(null)} type="button">
          ×
        </button>
      </div>
      <div className="home-explorer-panel__body">
        <div className="home-explorer-chip-group">
          {HOME_FILTER_SPACE_OPTIONS.map((option) => (
            <button
              className={`home-explorer-chip ${draftSpaceSelections.includes(option) ? 'home-explorer-chip--selected' : ''}`}
              key={option}
              onClick={() => setDraftSpaceSelections((current) => toggleSelection(current, option))}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="home-explorer-panel__footer">
        <button
          className="home-explorer-panel__action home-explorer-panel__action--ghost"
          onClick={() => setDraftSpaceSelections([])}
          type="button"
        >
          초기화
        </button>
        <button
          className="home-explorer-panel__action"
          disabled={draftSpaceSelections.length === 0}
          onClick={() => {
            setAppliedSpaceSelections(draftSpaceSelections);
            setOpenPanel(null);
          }}
          type="button"
        >
          선택완료
        </button>
      </div>
    </div>
  );

  const datePanel = (
    <div className="home-explorer-panel home-explorer-panel--date">
      <div className="home-explorer-panel__header">
        <span>날짜/시간</span>
        <button className="home-explorer-panel__close" onClick={() => setOpenPanel(null)} type="button">
          ×
        </button>
      </div>
      <div className="home-explorer-panel__body home-explorer-panel__body--date">
        <div className="home-explorer-date__month">
          <button type="button">‹</button>
          <span>2025년 8월</span>
          <button type="button">›</button>
        </div>
        <div className="home-explorer-date__weekdays">
          {['일', '월', '화', '수', '목', '금', '토'].map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="home-explorer-date__grid">
          {CALENDAR_CELLS.map((cell) => (
            <button
              className={`home-explorer-date__cell ${cell.outside ? 'home-explorer-date__cell--outside' : ''} ${!cell.outside && draftDate.day === cell.day ? 'home-explorer-date__cell--selected' : ''}`}
              disabled={cell.outside}
              key={cell.key}
              onClick={() =>
                !cell.outside &&
                setDraftDate((current) => ({
                  ...current,
                  day: cell.day,
                }))
              }
              type="button"
            >
              {cell.day}
            </button>
          ))}
        </div>
        <div className="home-explorer-date__time">
          <div className="home-explorer-date__time-header">
            <span>시간 선택</span>
            <span>{`${draftDate.startHour}시 ~ ${draftDate.endHour}시`}</span>
          </div>
          <Slider.Root
            aria-label={`${isHero ? '검색' : '탐색'} 시간 범위`}
            className="home-explorer-date__slider"
            max={24}
            min={0}
            minStepsBetweenThumbs={1}
            onValueChange={handleDateRangeChange}
            step={1}
            value={[draftDate.startHour, draftDate.endHour]}
          >
            <Slider.Track className="home-explorer-date__slider-track">
              <Slider.Range className="home-explorer-date__slider-range" />
            </Slider.Track>
            <Slider.Thumb
              aria-label={`${isHero ? '검색' : '탐색'} 시작 시간`}
              className="home-explorer-date__slider-thumb"
            />
            <Slider.Thumb
              aria-label={`${isHero ? '검색' : '탐색'} 종료 시간`}
              className="home-explorer-date__slider-thumb"
            />
          </Slider.Root>
          <div className="home-explorer-date__time-scale">
            <span>0시</span>
            <span>24시</span>
          </div>
        </div>
      </div>
      <div className="home-explorer-panel__footer">
        <button
          className="home-explorer-panel__action home-explorer-panel__action--ghost"
          onClick={() => setDraftDate(DEFAULT_DATE_DRAFT)}
          type="button"
        >
          초기화
        </button>
        <button
          className="home-explorer-panel__action"
          onClick={() => {
            setAppliedDate(draftDate);
            setOpenPanel(null);
          }}
          type="button"
        >
          선택완료
        </button>
      </div>
    </div>
  );

  const peoplePanel = (
    <div className="home-explorer-panel home-explorer-panel--people">
      <div className="home-explorer-panel__header">
        <span>인원</span>
        <button className="home-explorer-panel__close" onClick={() => setOpenPanel(null)} type="button">
          ×
        </button>
      </div>
      <div className="home-explorer-panel__body home-explorer-panel__body--people">
        <div className="home-explorer-people__row">
          <span className="home-explorer-people__label">인원 설정</span>
          <div className="home-explorer-people__stepper">
            <button onClick={() => setDraftPeopleCount((current) => Math.max(current - 1, 0))} type="button">
              −
            </button>
            <span>{draftPeopleCount}</span>
            <button onClick={() => setDraftPeopleCount((current) => current + 1)} type="button">
              +
            </button>
          </div>
        </div>
      </div>
      <div className="home-explorer-panel__footer">
        <button
          className="home-explorer-panel__action home-explorer-panel__action--ghost"
          onClick={() => setDraftPeopleCount(0)}
          type="button"
        >
          초기화
        </button>
        <button
          className="home-explorer-panel__action"
          disabled={draftPeopleCount === 0}
          onClick={() => {
            setAppliedPeopleCount(draftPeopleCount);
            setOpenPanel(null);
          }}
          type="button"
        >
          선택완료
        </button>
      </div>
    </div>
  );

  const keywordPanel = (
    <div className="home-explorer-panel home-explorer-panel--keyword">
      <div className="home-explorer-panel__header">
        <span>키워드</span>
        <button className="home-explorer-panel__close" onClick={() => setOpenPanel(null)} type="button">
          ×
        </button>
      </div>
      <div className="home-explorer-panel__body home-explorer-panel__body--keyword">
        {HOME_FILTER_KEYWORD_GROUPS.map((group) => (
          <div className="home-explorer-keyword__group" key={group.label}>
            <p className="home-explorer-keyword__label">{group.label}</p>
            <div className="home-explorer-chip-group">
              {group.options.map((option) => (
                <button
                  className={`home-explorer-chip ${draftKeywordSelections.includes(option) ? 'home-explorer-chip--selected' : ''}`}
                  key={option}
                  onClick={() => setDraftKeywordSelections((current) => toggleSelection(current, option))}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="home-explorer-panel__footer">
        <button
          className="home-explorer-panel__action home-explorer-panel__action--ghost"
          onClick={() => setDraftKeywordSelections([])}
          type="button"
        >
          초기화
        </button>
        <button
          className="home-explorer-panel__action"
          disabled={draftKeywordSelections.length === 0}
          onClick={() => {
            setAppliedKeywordSelections(draftKeywordSelections);
            setOpenPanel(null);
          }}
          type="button"
        >
          선택완료
        </button>
      </div>
    </div>
  );

  if (isHero) {
    return (
      <div className="home-search__card" ref={explorerRef}>
        <div className="home-search__filters">
          <div className="home-search__filter-wrap">
            {hasActiveRegion ? (
              <div className="home-search__filter-control">
                <button className="home-search__filter home-search__filter--split" onClick={openRegionPanel} type="button">
                  <span>{regionButtonLabel}</span>
                  <ChevronIcon />
                </button>
                <button
                  aria-label="지역 필터 초기화"
                  className="home-search__filter-clear"
                  onClick={clearRegionFilter}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : (
              <button className="home-search__filter" onClick={openRegionPanel} type="button">
                <span>{regionButtonLabel}</span>
                <ChevronIcon />
              </button>
            )}
            {openPanel === 'region' ? regionPanel : null}
          </div>

          <div className="home-search__filter-wrap">
            {hasActiveSpace ? (
              <div className="home-search__filter-control">
                <button className="home-search__filter home-search__filter--split" onClick={openSpacePanel} type="button">
                  <span>{spaceButtonLabel}</span>
                  <ChevronIcon />
                </button>
                <button
                  aria-label="공간 필터 초기화"
                  className="home-search__filter-clear"
                  onClick={clearSpaceFilter}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : (
              <button className="home-search__filter" onClick={openSpacePanel} type="button">
                <span>{spaceButtonLabel}</span>
                <ChevronIcon />
              </button>
            )}
            {openPanel === 'space' ? spacePanel : null}
          </div>

          <div className="home-search__filter-wrap">
            {hasActiveKeyword ? (
              <div className="home-search__filter-control">
                <button
                  className="home-search__filter home-search__filter--split"
                  onClick={openKeywordPanel}
                  type="button"
                >
                  <span>{keywordButtonLabel}</span>
                  <ChevronIcon />
                </button>
                <button
                  aria-label="키워드 필터 초기화"
                  className="home-search__filter-clear"
                  onClick={clearKeywordFilter}
                  type="button"
                >
                  ×
                </button>
              </div>
            ) : (
              <button className="home-search__filter" onClick={openKeywordPanel} type="button">
                <span>{keywordButtonLabel}</span>
                <ChevronIcon />
              </button>
            )}
            {openPanel === 'keyword' ? keywordPanel : null}
          </div>

          <button
            className={`home-search__filter ${reservableOnly ? 'home-search__filter--active' : ''}`}
            onClick={() => setReservableOnly((current) => !current)}
            type="button"
          >
            예약가능
          </button>

          <button
            className={`home-search__filter ${parkingOnly ? 'home-search__filter--active' : ''}`}
            onClick={() => setParkingOnly((current) => !current)}
            type="button"
          >
            주차가능
          </button>
        </div>

        <div className="home-search__bar">
          <div className="home-search__field home-search__field--wide">
            <span className="home-search__field-inner">
              <SearchIcon />
              <input
                className="home-search__input"
                onChange={(event) => setHeroSearchQuery(event.target.value)}
                placeholder="어떤 음악 공간을 찾으시나요?"
                value={heroSearchQuery}
              />
              {heroSearchQuery ? (
                <button
                  aria-label="메인 검색어 지우기"
                  className="home-search__clear"
                  onClick={() => setHeroSearchQuery('')}
                  type="button"
                >
                  ×
                </button>
              ) : null}
            </span>
          </div>

          <div className="home-search__field-wrap">
            <button
              className={`home-search__field ${openPanel === 'date' || appliedDate ? 'home-search__field--active' : ''}`}
              onClick={openDatePanel}
              type="button"
            >
              <span>{dateButtonLabel}</span>
              <ChevronIcon />
            </button>
            {openPanel === 'date' ? datePanel : null}
          </div>

          <div className="home-search__field-wrap">
            <button
              className={`home-search__field ${openPanel === 'people' || appliedPeopleCount > 0 ? 'home-search__field--active' : ''}`}
              onClick={openPeoplePanel}
              type="button"
            >
              <span>{peopleButtonLabel}</span>
              <ChevronIcon />
            </button>
            {openPanel === 'people' ? peoplePanel : null}
          </div>

          <button className="home-search__submit" type="button">
            검색
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-explorer" ref={explorerRef}>
      <div className="home-explorer__toolbar">
        <div className="home-explorer__filter-wrap">
          {hasActiveRegion ? (
            <div className="home-explorer__filter-control">
              <button className="home-explorer__filter home-explorer__filter--split" onClick={openRegionPanel} type="button">
                <span>{regionButtonLabel}</span>
                <ChevronIcon />
              </button>
              <button
                aria-label="지역 필터 초기화"
                className="home-explorer__filter-clear"
                onClick={clearRegionFilter}
                type="button"
              >
                ×
              </button>
            </div>
          ) : (
            <button className="home-explorer__filter" onClick={openRegionPanel} type="button">
              <span>{regionButtonLabel}</span>
              <ChevronIcon />
            </button>
          )}
          {openPanel === 'region' ? regionPanel : null}
        </div>

        <div className="home-explorer__filter-wrap">
          {hasActiveSpace ? (
            <div className="home-explorer__filter-control">
              <button className="home-explorer__filter home-explorer__filter--split" onClick={openSpacePanel} type="button">
                <span>{spaceButtonLabel}</span>
                <ChevronIcon />
              </button>
              <button
                aria-label="공간 필터 초기화"
                className="home-explorer__filter-clear"
                onClick={clearSpaceFilter}
                type="button"
              >
                ×
              </button>
            </div>
          ) : (
            <button className="home-explorer__filter" onClick={openSpacePanel} type="button">
              <span>{spaceButtonLabel}</span>
              <ChevronIcon />
            </button>
          )}
          {openPanel === 'space' ? spacePanel : null}
        </div>

        <div className="home-explorer__filter-wrap">
          {hasActiveDate ? (
            <div className="home-explorer__filter-control">
              <button className="home-explorer__filter home-explorer__filter--split" onClick={openDatePanel} type="button">
                <span>{dateButtonLabel}</span>
                <ChevronIcon />
              </button>
              <button
                aria-label="날짜시간 필터 초기화"
                className="home-explorer__filter-clear"
                onClick={clearDateFilter}
                type="button"
              >
                ×
              </button>
            </div>
          ) : (
            <button className="home-explorer__filter" onClick={openDatePanel} type="button">
              <span>{dateButtonLabel}</span>
              <ChevronIcon />
            </button>
          )}
          {openPanel === 'date' ? datePanel : null}
        </div>

        <div className="home-explorer__filter-wrap">
          {hasActivePeople ? (
            <div className="home-explorer__filter-control">
              <button className="home-explorer__filter home-explorer__filter--split" onClick={openPeoplePanel} type="button">
                <span>{peopleButtonLabel}</span>
                <ChevronIcon />
              </button>
              <button
                aria-label="인원 필터 초기화"
                className="home-explorer__filter-clear"
                onClick={clearPeopleFilter}
                type="button"
              >
                ×
              </button>
            </div>
          ) : (
            <button className="home-explorer__filter" onClick={openPeoplePanel} type="button">
              <span>{peopleButtonLabel}</span>
              <ChevronIcon />
            </button>
          )}
          {openPanel === 'people' ? peoplePanel : null}
        </div>

        <div className="home-explorer__filter-wrap">
          {hasActiveKeyword ? (
            <div className="home-explorer__filter-control">
              <button
                className="home-explorer__filter home-explorer__filter--split"
                onClick={openKeywordPanel}
                type="button"
              >
                <span>{keywordButtonLabel}</span>
                <ChevronIcon />
              </button>
              <button
                aria-label="키워드 필터 초기화"
                className="home-explorer__filter-clear"
                onClick={clearKeywordFilter}
                type="button"
              >
                ×
              </button>
            </div>
          ) : (
            <button className="home-explorer__filter" onClick={openKeywordPanel} type="button">
              <span>{keywordButtonLabel}</span>
              <ChevronIcon />
            </button>
          )}
          {openPanel === 'keyword' ? keywordPanel : null}
        </div>

        <button
          className={`home-explorer__filter ${reservableOnly ? 'home-explorer__filter--active' : ''}`}
          onClick={() => setReservableOnly((current) => !current)}
          type="button"
        >
          예약가능
        </button>

        <button
          className={`home-explorer__filter ${parkingOnly ? 'home-explorer__filter--active' : ''}`}
          onClick={() => setParkingOnly((current) => !current)}
          type="button"
        >
          주차가능
        </button>
      </div>

      <div className="home-space-grid">
        {HOME_SPACE_CARDS.map((space) => (
          <HomeSpaceCard key={space.title} {...space} />
        ))}
      </div>
    </div>
  );
}
