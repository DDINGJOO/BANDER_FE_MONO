import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HomeFooter } from "../components/home/HomeFooter";
import { HomeHeader } from "../components/home/HomeHeader";
import { ChevronIcon, SelectedCheckIcon } from "../components/shared/Icons";
import { HEADER_SEARCH_KEYWORD_SUGGESTIONS } from "../config/searchSuggestions";
import { loadAuthSession } from "../data/authSession";
import { KOREA_REGIONS } from "../data/koreaRegions";
import {
  formatProfileGenresDisplay,
  formatProfileInstrumentsDisplay,
  PROFILE_EDIT_DEFAULT_PHOTO,
  PROFILE_EDIT_DEFAULTS,
  type ProfileEditGender,
} from "../data/profileEdit";
import {
  ProfileGenreInstrumentModal,
  type ProfileGenreInstrumentTab,
} from "../components/profile/ProfileGenreInstrumentModal";
import "../styles/profile-edit.css";

/** Figma 6415:78154 — 닉네임 사용가능 체크 (Blue #2C80FF) */
function NicknameAvailableGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="profile-edit__nick-available-icon"
      fill="none"
      height="14"
      viewBox="0 0 14 14"
      width="14"
    >
      <path
        d="M3 7.15L5.65 9.8L11 4.45"
        stroke="#2C80FF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Figma 6415:78014 — 프로필 카메라 버튼 */
function ProfileEditCameraGlyph() {
  return (
    <svg
      aria-hidden="true"
      className="profile-edit__camera-glyph"
      fill="none"
      viewBox="0 0 22 18"
      width="22"
      height="18"
    >
      <path
        d="M2.75 4.5h2.2L6.6 2.25h8.8l1.65 2.25h2.2c.76 0 1.375.62 1.375 1.375v9.9c0 .76-.62 1.375-1.375 1.375H2.75c-.76 0-1.375-.62-1.375-1.375v-9.9C1.375 5.12 1.99 4.5 2.75 4.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="10.35" fill="currentColor" r="2.75" />
    </svg>
  );
}

export function ProfileEditPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(loadAuthSession());
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const headerSearchRef = useRef<HTMLDivElement | null>(null);

  const initialNickname = PROFILE_EDIT_DEFAULTS.nickname;
  /** 서버(또는 최초 로드) 기준 닉네임 — 수정 여부 판단용 */
  const [savedNickname] = useState(initialNickname);
  const [nickname, setNickname] = useState(initialNickname);
  /** 마지막으로 중복확인 통과한 문자열(초기는 저장값과 동일 = 별도 확인 없이 제출 가능) */
  const [checkedNickname, setCheckedNickname] = useState(initialNickname);
  const [gender, setGender] = useState<ProfileEditGender>(
    PROFILE_EDIT_DEFAULTS.gender,
  );
  const [region, setRegion] = useState(PROFILE_EDIT_DEFAULTS.region);
  const [genres, setGenres] = useState<string[]>(PROFILE_EDIT_DEFAULTS.genres);
  const [instruments, setInstruments] = useState<string[]>(
    PROFILE_EDIT_DEFAULTS.instruments,
  );
  const [giModalOpen, setGiModalOpen] = useState(false);
  const [giModalTab, setGiModalTab] =
    useState<ProfileGenreInstrumentTab>("genre");
  const [bio, setBio] = useState(PROFILE_EDIT_DEFAULTS.bio);
  const [photoUrl, setPhotoUrl] = useState(PROFILE_EDIT_DEFAULT_PHOTO);
  const [regionOpen, setRegionOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  /** Figma 6200:9477 — 변경 전에는 수정완료 비활성(회색) */
  const [formDirty, setFormDirty] = useState(false);

  const savedTrim = savedNickname.trim();
  const nickTrim = nickname.trim();

  const isSameAsSaved = nickTrim.length > 0 && nickTrim === savedTrim;
  const isSameAsChecked =
    nickTrim.length > 0 && nickTrim === checkedNickname.trim();
  /** 닉네임을 건드리지 않았거나(저장값과 동일), 새 값으로 중복확인까지 끝난 경우만 제출 가능 */
  const nickOkForSubmit =
    nickTrim.length > 0 && (isSameAsSaved || isSameAsChecked);
  /** 저장값과 다르고 아직 확인 안 된 입력 → 중복확인 표시 */
  const showDuplicateBtn =
    nickTrim.length > 0 && !isSameAsSaved && !isSameAsChecked;
  /** Figma 6415:78154 — 저장 닉과 다른 새 닉만 「사용가능」(6200 기본 화면에는 없음) */
  const showAvailable =
    nickTrim.length > 0 && !isSameAsSaved && isSameAsChecked;
  const nickRowPlain = !showDuplicateBtn && !showAvailable;

  const canSubmit = nickOkForSubmit && formDirty;

  const closeRegion = useCallback(() => setRegionOpen(false), []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!headerSearchRef.current?.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filteredSuggestions = HEADER_SEARCH_KEYWORD_SUGGESTIONS.filter((item) =>
    item.toLowerCase().includes(headerSearchQuery.toLowerCase()),
  );

  const onHeaderSearchSubmit = (value: string) => {
    const q = value.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    if (!regionOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = regionRef.current;
      if (!el || el.contains(e.target as Node)) return;
      closeRegion();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRegion();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [regionOpen, closeRegion]);

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormDirty(true);
    const url = URL.createObjectURL(file);
    setPhotoUrl((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  };

  useEffect(() => {
    return () => {
      if (photoUrl.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const onDuplicateCheck = () => {
    if (!nickTrim) return;
    // TODO: API 중복 검사 — 성공 시에만 setCheckedNickname 호출
    setCheckedNickname(nickTrim);
  };

  return (
    <main className="profile-edit-page">
      <HomeHeader
        authenticated={isAuthenticated}
        filteredSuggestions={filteredSuggestions}
        onGuestCta={() => navigate("/login")}
        onSearchChange={(value) => {
          setHeaderSearchQuery(value);
          setHeaderSearchOpen(Boolean(value.trim()));
        }}
        onSearchClear={() => {
          setHeaderSearchQuery("");
          setHeaderSearchOpen(false);
        }}
        onSearchFocus={() =>
          setHeaderSearchOpen(Boolean(headerSearchQuery.trim()))
        }
        onSearchSubmit={onHeaderSearchSubmit}
        onSuggestionSelect={(value) => {
          setHeaderSearchOpen(false);
          onHeaderSearchSubmit(value);
        }}
        searchOpen={headerSearchOpen}
        searchQuery={headerSearchQuery}
        searchRef={headerSearchRef}
      />

      <div className="profile-edit-page__main">
        <div className="profile-edit">
          <header className="profile-edit__header">
            <button
              type="button"
              className="profile-edit__back"
              onClick={() => navigate(-1)}
              aria-label="뒤로"
            >
              <span className="profile-edit__back-chevron" aria-hidden>
                <ChevronIcon />
              </span>
            </button>
            <h1 className="profile-edit__title">프로필 수정</h1>
          </header>

          <div className="profile-edit__photo-wrap">
            <div className="profile-edit__photo-ring">
              <img className="profile-edit__photo" src={photoUrl} alt="" />
            </div>
            <label className="profile-edit__camera">
              <input
                type="file"
                accept="image/*"
                className="profile-edit__camera-input"
                onChange={onPhotoChange}
              />
              <span className="profile-edit__camera-btn" aria-hidden>
                <ProfileEditCameraGlyph />
              </span>
            </label>
          </div>

          <div className="profile-edit__fields">
            <div className="profile-edit__field">
              <span className="profile-edit__label">닉네임</span>
              <div
                className={`profile-edit__nick-row${nickRowPlain ? " profile-edit__nick-row--plain" : ""}`}
              >
                <input
                  className="profile-edit__nick-input"
                  value={nickname}
                  onChange={(e) => {
                    setFormDirty(true);
                    setNickname(e.target.value);
                  }}
                  maxLength={20}
                  placeholder="닉네임"
                  aria-invalid={showDuplicateBtn}
                />
                {showDuplicateBtn ? (
                  <button
                    type="button"
                    className="profile-edit__nick-dup"
                    onClick={onDuplicateCheck}
                  >
                    중복확인
                  </button>
                ) : null}
                {showAvailable ? (
                  <span className="profile-edit__nick-available">
                    <NicknameAvailableGlyph />
                    사용가능
                  </span>
                ) : null}
              </div>
            </div>

            <div className="profile-edit__field">
              <span className="profile-edit__label">성별</span>
              <div
                className="profile-edit__gender-row"
                role="group"
                aria-label="성별"
              >
                <button
                  type="button"
                  className={`profile-edit__gender-pill${gender === "male" ? " profile-edit__gender-pill--active" : ""}`}
                  onClick={() => {
                    setFormDirty(true);
                    setGender("male");
                  }}
                >
                  {gender === "male" ? (
                    <span
                      className="profile-edit__gender-corner-check"
                      aria-hidden
                    >
                      <SelectedCheckIcon />
                    </span>
                  ) : null}
                  남자
                </button>
                <button
                  type="button"
                  className={`profile-edit__gender-pill${gender === "female" ? " profile-edit__gender-pill--active" : ""}`}
                  onClick={() => {
                    setFormDirty(true);
                    setGender("female");
                  }}
                >
                  {gender === "female" ? (
                    <span
                      className="profile-edit__gender-corner-check"
                      aria-hidden
                    >
                      <SelectedCheckIcon />
                    </span>
                  ) : null}
                  여자
                </button>
              </div>
            </div>

            <div className="profile-edit__field" ref={regionRef}>
              <span className="profile-edit__label">사는 지역</span>
              <button
                type="button"
                className={`profile-edit__select${regionOpen ? " profile-edit__select--open" : ""}`}
                onClick={() => setRegionOpen((o) => !o)}
                aria-expanded={regionOpen}
                aria-haspopup="listbox"
              >
                <span className="profile-edit__select-value">{region}</span>
                <span
                  className="profile-edit__select-chevron profile-edit__select-chevron--sm"
                  aria-hidden
                >
                  <ChevronIcon />
                </span>
              </button>
              {regionOpen ? (
                <ul className="profile-edit__select-menu" role="listbox">
                  {KOREA_REGIONS.map((r) => (
                    <li key={r} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={region === r}
                        className={`profile-edit__select-option${region === r ? " profile-edit__select-option--selected" : ""}`}
                        onClick={() => {
                          setFormDirty(true);
                          setRegion(r);
                          setRegionOpen(false);
                        }}
                      >
                        <span
                          className="profile-edit__select-option-check"
                          aria-hidden
                        >
                          {region === r ? <SelectedCheckIcon /> : null}
                        </span>
                        {r}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="profile-edit__field">
              <span className="profile-edit__label">선호하는 장르/악기</span>
              <div className="profile-edit__gi-row">
                <button
                  type="button"
                  className="profile-edit__select profile-edit__select--trigger"
                  onClick={() => {
                    setGiModalTab("genre");
                    setGiModalOpen(true);
                  }}
                >
                  <span
                    className={`profile-edit__select-value${formatProfileGenresDisplay(genres) ? "" : " profile-edit__select-value--placeholder"}`}
                  >
                    {formatProfileGenresDisplay(genres) || "장르 선택"}
                  </span>
                  <span
                    className="profile-edit__select-chevron profile-edit__select-chevron--sm"
                    aria-hidden
                  >
                    <ChevronIcon />
                  </span>
                </button>
                <button
                  type="button"
                  className="profile-edit__select profile-edit__select--trigger"
                  onClick={() => {
                    setGiModalTab("instrument");
                    setGiModalOpen(true);
                  }}
                >
                  <span
                    className={`profile-edit__select-value${formatProfileInstrumentsDisplay(instruments) ? "" : " profile-edit__select-value--placeholder"}`}
                  >
                    {formatProfileInstrumentsDisplay(instruments) ||
                      "악기 선택"}
                  </span>
                  <span
                    className="profile-edit__select-chevron profile-edit__select-chevron--sm"
                    aria-hidden
                  >
                    <ChevronIcon />
                  </span>
                </button>
              </div>
            </div>

            <label className="profile-edit__field profile-edit__field--bio">
              <span className="profile-edit__label">소개 (선택)</span>
              <textarea
                className="profile-edit__textarea"
                value={bio}
                onChange={(e) => {
                  setFormDirty(true);
                  setBio(e.target.value);
                }}
                maxLength={200}
                rows={5}
                placeholder="소개를 입력해 주세요"
              />
              <span className="profile-edit__bio-count">{bio.length}/200</span>
            </label>
          </div>

          <div className="profile-edit__submit-wrap">
            <button
              type="button"
              className={`profile-edit__submit${canSubmit ? " profile-edit__submit--active" : ""}`}
              disabled={!canSubmit}
            >
              수정완료
            </button>
          </div>

          <ProfileGenreInstrumentModal
            initialGenres={genres}
            initialInstruments={instruments}
            initialTab={giModalTab}
            open={giModalOpen}
            onClose={() => setGiModalOpen(false)}
            onApply={(g, i) => {
              setFormDirty(true);
              setGenres(g);
              setInstruments(i);
            }}
          />
        </div>
      </div>

      <HomeFooter />
    </main>
  );
}
