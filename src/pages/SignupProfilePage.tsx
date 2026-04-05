import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getNicknameAvailability, requestProfileImageUpload } from '../api/auth';
import { BrandMark } from '../components/shared/BrandMark';
import {
  AvailabilityIcon,
  CameraIcon,
  ChevronIcon,
  SelectedCheckIcon,
  UnavailableIcon,
} from '../components/shared/Icons';
import { KOREA_REGIONS } from '../data/auth';
import { loadSignupDraft, saveSignupDraft } from '../data/authSession';

const DEFAULT_PROFILE_IMAGE_REF = 'profile/default-v1';

export function SignupProfilePage() {
  const navigate = useNavigate();
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [nickname, setNickname] = useState('활기찬다람쥐');
  const [region, setRegion] = useState('서울특별시');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [nicknameAvailability, setNicknameAvailability] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const regionMenuRef = useRef<HTMLDivElement | null>(null);
  const normalizedNickname = nickname.trim();
  const nicknameAvailable = nicknameAvailability === 'available';
  const canContinue = nicknameAvailable && region.trim().length > 0;

  useEffect(() => {
    const draft = loadSignupDraft();
    if (!draft?.signupCompletionToken) {
      navigate('/signup', { replace: true });
      return;
    }

    if (draft.nickname) {
      setNickname(draft.nickname);
    }
    if (draft.regionCode) {
      setRegion(draft.regionCode);
    }
    if (draft.gender === 'MALE') {
      setGender('male');
    } else if (draft.gender === 'FEMALE') {
      setGender('female');
    }
  }, [navigate]);

  useEffect(() => {
    return () => {
      if ((profileImageUrl || '').startsWith('blob:')) {
        URL.revokeObjectURL(profileImageUrl);
      }
    };
  }, [profileImageUrl]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!regionMenuRef.current?.contains(event.target as Node)) {
        setIsRegionOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (normalizedNickname.length < 2) {
      setNicknameAvailability('idle');
      return undefined;
    }

    let active = true;
    setNicknameAvailability('checking');

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await getNicknameAvailability(normalizedNickname);
        if (!active) {
          return;
        }
        setNicknameAvailability(result.available ? 'available' : 'unavailable');
      } catch (error) {
        if (!active) {
          return;
        }
        setNicknameAvailability('unavailable');
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [normalizedNickname]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) {
      return;
    }

    const draft = loadSignupDraft();
    if (!draft?.signupCompletionToken || !draft.email) {
      navigate('/signup', { replace: true });
      return;
    }

    let profileImageRef = DEFAULT_PROFILE_IMAGE_REF;

    if (selectedImageFile) {
      try {
        const grant = await requestProfileImageUpload(
          draft.signupCompletionToken,
          selectedImageFile.name,
          selectedImageFile.type,
          selectedImageFile.size,
        );
        await fetch(grant.uploadUrl, {
          method: 'PUT',
          body: selectedImageFile,
          headers: { 'Content-Type': selectedImageFile.type },
        });
        profileImageRef = grant.profileImageRef;
      } catch {
        // fall back to default if upload fails
      }
    }

    saveSignupDraft({
      ...draft,
      gender: gender === 'male' ? 'MALE' : gender === 'female' ? 'FEMALE' : 'PREFER_NOT_TO_SAY',
      nickname: normalizedNickname,
      profileImageRef,
      regionCode: region.trim(),
    });
    navigate('/signup/terms');
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedImageFile(file);
    const nextUrl = URL.createObjectURL(file);
    setProfileImageUrl((current) => {
      if ((current || '').startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }

      return nextUrl;
    });
  };

  return (
    <main className="signup-page">
      <section className="signup-shell" aria-labelledby="signup-profile-title">
        <div className="signup-brand">
          <BrandMark />
        </div>

        <h1 className="signup-headline" id="signup-profile-title">
          당신의 음악을, 당신의 공간에
        </h1>

        <ol aria-label="회원가입 단계" className="signup-progress">
          <li className="signup-progress__item">
            <span className="signup-progress__badge">1</span>
            <span className="signup-progress__label">기본정보</span>
          </li>
          <li className="signup-progress__item signup-progress__item--active">
            <span className="signup-progress__badge signup-progress__badge--active">2</span>
            <span className="signup-progress__label">부가정보</span>
          </li>
          <li className="signup-progress__item">
            <span className="signup-progress__badge">3</span>
            <span className="signup-progress__label">약관동의</span>
          </li>
        </ol>

        <form className="signup-card signup-card--profile" onSubmit={handleSubmit}>
          <div className="signup-card__body signup-card__body--profile">
            <div className="signup-profile__avatar-wrap">
              <div className="signup-profile__avatar signup-profile__avatar--photo">
                {profileImageUrl ? (
                  <img
                    alt="프로필 이미지 미리보기"
                    className="signup-profile__avatar-image"
                    src={profileImageUrl}
                  />
                ) : (
                  <div aria-hidden="true" className="signup-profile__avatar-photo" />
                )}
              </div>
              <label className="signup-profile__avatar-button" htmlFor="profileImage">
                <CameraIcon />
              </label>
              <input
                accept="image/*"
                aria-label="프로필 사진 업로드"
                className="sr-only"
                id="profileImage"
                onChange={handleProfileImageChange}
                type="file"
              />
            </div>

            <div className="signup-profile__fields">
              <div className="signup-section">
                <label className="signup-label" htmlFor="profileNickname">
                  닉네임
                </label>
                <div className="signup-input">
                  <input
                    className="signup-input__control"
                    id="profileNickname"
                    name="nickname"
                    onChange={(event) => setNickname(event.target.value)}
                    type="text"
                    value={nickname}
                  />
                  {normalizedNickname.length > 0 ? (
                    <span
                      className={`signup-status ${
                        nicknameAvailability === 'available'
                          ? 'signup-status--available'
                          : 'signup-status--unavailable'
                      }`}
                    >
                      {nicknameAvailability === 'available' ? <AvailabilityIcon /> : <UnavailableIcon />}
                      <span
                        className={`signup-status__text ${
                          nicknameAvailability === 'available'
                            ? 'signup-status__text--available'
                            : 'signup-status__text--unavailable'
                        }`}
                      >
                        {nicknameAvailability === 'checking'
                          ? '확인중...'
                          : nicknameAvailability === 'available'
                            ? '사용가능'
                            : '사용불가'}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="signup-section">
                <span className="signup-label">성별 (선택)</span>
                <div className="signup-profile__gender">
                  <button
                    className={`signup-profile__gender-button ${
                      gender === 'male' ? 'signup-profile__gender-button--active' : ''
                    }`}
                    onClick={() => setGender('male')}
                    type="button"
                  >
                    남자
                  </button>
                  <button
                    className={`signup-profile__gender-button ${
                      gender === 'female' ? 'signup-profile__gender-button--active' : ''
                    }`}
                    onClick={() => setGender('female')}
                    type="button"
                  >
                    여자
                  </button>
                </div>
              </div>

              <div className="signup-section">
                <label className="signup-label" htmlFor="profileRegionButton">
                  사는 지역 (선택)
                </label>
                <div className="signup-region" ref={regionMenuRef}>
                  <button
                    aria-controls="profileRegionMenu"
                    aria-expanded={isRegionOpen}
                    className="signup-input signup-input--select signup-region__trigger"
                    id="profileRegionButton"
                    onClick={() => setIsRegionOpen((current) => !current)}
                    type="button"
                  >
                    <span
                      className={`signup-input__control signup-region__value ${
                        region ? 'signup-region__value--selected' : ''
                      }`}
                    >
                      {region || '지역을 선택해주세요.'}
                    </span>
                    <span className={isRegionOpen ? 'signup-region__chevron signup-region__chevron--open' : 'signup-region__chevron'}>
                      <ChevronIcon />
                    </span>
                  </button>

                  {isRegionOpen ? (
                    <div className="signup-region-menu" id="profileRegionMenu" role="listbox">
                      {KOREA_REGIONS.map((option) => (
                        <button
                          aria-selected={region === option}
                          className={`signup-region-menu__item ${
                            region === option ? 'signup-region-menu__item--selected' : ''
                          }`}
                          key={option}
                          onClick={() => {
                            setRegion(option);
                            setIsRegionOpen(false);
                          }}
                          role="option"
                          type="button"
                        >
                          <span className="signup-region-menu__label">{option}</span>
                          {region === option ? <SelectedCheckIcon /> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <button
            className={`signup-next-button ${canContinue ? 'signup-next-button--active' : ''}`}
            disabled={!canContinue}
            type="submit"
          >
            다음
          </button>
        </form>

        <p className="signup-footer">
          <span>이미 계정이 있으신가요?</span>
          <Link className="signup-footer__link" to="/login">
            로그인
          </Link>
        </p>
      </section>
    </main>
  );
}
