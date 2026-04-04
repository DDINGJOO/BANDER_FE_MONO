/**
 * 프로필 수정(/profile/edit) 전용 기본값.
 * 회원가입 `signupDraft` / `SignupProfilePage` 플로우와 분리 — 가입 시 받은 값은 추후 API(예: GET /me)로 채웁니다.
 */
export type ProfileEditGender = 'female' | 'male';

export type ProfileEditFormDefaults = {
  bio: string;
  gender: ProfileEditGender;
  /** 선호 장르 (모달에서 최대 3개) */
  genres: string[];
  /** 선호 악기 (모달에서 최대 3개) */
  instruments: string[];
  nickname: string;
  region: string;
};

export const PROFILE_EDIT_DEFAULTS: ProfileEditFormDefaults = {
  bio: '안녕하세요 뮤지션J 입니다.',
  gender: 'female',
  genres: ['밴드', '록/메탈'],
  instruments: ['기타'],
  nickname: '뮤지션J',
  region: '서울특별시',
};

export function formatProfileGenresDisplay(genres: string[]): string {
  if (genres.length === 0) {
    return '';
  }
  return `장르 : ${genres.join(', ')}`;
}

export function formatProfileInstrumentsDisplay(instruments: string[]): string {
  if (instruments.length === 0) {
    return '';
  }
  return `악기 : ${instruments.join(', ')}`;
}

/** Figma MCP — 기본 프로필 사진 (만료 시 서버 URL로 교체) */
export const PROFILE_EDIT_DEFAULT_PHOTO =
  'https://www.figma.com/api/mcp/asset/51990e6d-0caa-4650-89bd-fe87643a702e';
