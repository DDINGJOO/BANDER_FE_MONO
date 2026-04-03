# 밴더 프론트엔드 → 백엔드 API 목록

이 문서는 `src/` 코드를 기준으로 정리했습니다.

- **연동됨**: `getJson` / `postJson`으로 실제 호출하는 엔드포인트 (`src/api/auth.ts`).
- **미연동**: 아직 API 모듈이 없고 `src/data/*` 목 데이터만 쓰는 화면에서 **동일 UX를 만들 때 필요한 요청**을 페이지별로 추정한 목록입니다. 경로는 백엔드 네이밍에 맞게 조정하면 됩니다.

---

## 1. HTTP 공통 규약 (`src/api/client.ts`)

| 항목 | 내용 |
|------|------|
| Base URL | `REACT_APP_API_BASE_URL` (미설정 시 빈 문자열 → CRA `proxy`로 상대 경로) |
| 요청 본문 | `Content-Type: application/json` |
| 응답 래퍼 | `{ success: boolean, data?: T, error?: { code?, message? }, timestamp?: string }` — 성공 시 `data`만 `requestJson` 반환값으로 사용 |
| 인증 헤더 | 세션에 `gatewayContextToken` 있으면 `X-Gateway-Context`, `X-Gateway-Auth` (`REACT_APP_GATEWAY_AUTH_TOKEN`, 기본값 `local-dev-gateway-token`) |
| 401 | `clearAuthSession()` 호출 후 에러 throw |

---

## 2. 연동됨 — Auth (`/api/v1/auth/*`)

타입 정의: `src/types/authApi.ts` · 호출 함수: `src/api/auth.ts`

| Method | Path | 함수 | 사용 페이지 |
|--------|------|------|-------------|
| POST | `/api/v1/auth/signup/request` | `requestSignupVerification` | `/signup` |
| POST | `/api/v1/auth/signup/resend` | `resendSignupVerification` | `/signup` |
| POST | `/api/v1/auth/signup/verify` | `verifySignupCode` | `/signup` |
| POST | `/api/v1/auth/signup/registration` | `registerSignup` | `/signup` |
| GET | `/api/v1/auth/signup/terms` | `getSignupTerms` | `/signup/terms` |
| GET | `/api/v1/auth/signup/nickname/availability?nickname=` | `getNicknameAvailability` | `/signup/profile` |
| POST | `/api/v1/auth/signup/completion` | `completeSignup` | `/signup/terms` |
| POST | `/api/v1/auth/password/reset/request` | `requestPasswordReset` | `/forgot-password` |
| POST | `/api/v1/auth/password/reset/resend` | `resendPasswordReset` | `/forgot-password` |
| POST | `/api/v1/auth/password/reset/verify` | `verifyPasswordResetCode` | `/forgot-password` |
| POST | `/api/v1/auth/password/reset/confirm` | `completePasswordReset` | `/forgot-password/reset` |
| POST | `/api/v1/auth/login` | `login` | `/login` |

### 요청/응답 요약

- **POST …/signup/request** — body: `{ email }` → `VerificationIssueResponse`
- **POST …/signup/resend** — body: `{ email }` → `VerificationIssueResponse`
- **POST …/signup/verify** — body: `{ email, verificationCode }` → `SignupVerificationVerifyResponse`
- **POST …/signup/registration** — body: `{ verifiedEmailToken, password, passwordConfirm }` → `SignupRegistrationResponse`
- **GET …/signup/terms** → `SignupTermResponse[]`
- **GET …/signup/nickname/availability** → `SignupNicknameAvailabilityResponse`
- **POST …/signup/completion** — body: `{ signupCompletionToken, nickname, gender, regionCode, profileImageRef, consents[] }` → `SignupCompletionResponse`
- **POST …/password/reset/request** — body: `{ email }` → `VerificationIssueResponse`
- **POST …/password/reset/resend** — body: `{ email }` → `VerificationIssueResponse`
- **POST …/password/reset/verify** — body: `{ email, verificationCode }` → `PasswordResetVerifyResponse`
- **POST …/password/reset/confirm** — body: `{ passwordResetToken, password, passwordConfirm }` → `{ userId }`
- **POST …/login** — body: `{ email, password }` → `LoginResponse` (`gatewayContextToken`, `expiresAt`, `userId`)

---

## 3. 미연동 — 페이지·기능별 필요 API (제안)

아래 경로는 **제안 스키마**입니다. 실제 백엔드 설계에 맞게 `/api/v1/...` 이하만 통일하면 됩니다.

### `/`, `/home-auth` — `MainPage`

| 제안 Method | 제안 Path | 목적 |
|-------------|-----------|------|
| GET | `/api/v1/home/feed` 또는 분리 | 인기 게시글, 공간 카드, 후기, 카테고리/필터 메타 등 홈 구성 데이터 |
| GET | `/api/v1/regions` | 지역·구군 트리 (`HOME_FILTER_*` 대체) |

### `/search` — `SearchResultsPage`

| 제안 Method | 제안 Path | 목적 |
|-------------|-----------|------|
| GET | `/api/v1/search/spaces?q=&sort=` | 공간 탭 결과 |
| GET | `/api/v1/search/vendors?q=` | 업체 탭 결과 |
| GET | `/api/v1/search/posts?q=&sort=` | 커뮤니티 탭 결과 |

### `/spaces/:slug` — `SpaceDetailPage`

| 제안 Method | 제안 Path | 목적 |
|-------------|-----------|------|
| GET | `/api/v1/spaces/{slug}` | 상세 메타·갤러리·가격·정책·업체·후기·유사 공간 (`useSpaceDetail` / `ROOM_DETAIL_*` 대체) |
| POST | `/api/v1/spaces/{slug}/scrap` | 저장(스크랩) 토글 — UI에 버튼 있음 |
| DELETE | `/api/v1/spaces/{slug}/scrap` | 저장 해제 (또는 POST body로 toggle) |
| POST | `/api/v1/users/me/phone-verification` 등 | 본인인증 플로우 — 예약 카드 게이트와 연동 |
| GET | `/api/v1/spaces/{slug}/calendar?month=` | 예약 가능 월/일 (현재 정적 캘린더) |

### `/spaces/:slug/reserve` — `SpaceReservationPage`

| 제안 Method | 제안 Path | 목적 |
|-------------|-----------|------|
| GET | `/api/v1/spaces/{slug}/availability?date=YYYY-MM-DD` | 타임라인 슬롯·가격·예약 가능 여부 |
| GET | `/api/v1/spaces/{slug}/options` | 드럼/기타 등 옵션 상품 목록 |
| GET | `/api/v1/coupons?spaceId=` 또는 `context=` | 쿠폰 목록·다운로드 상태 |
| POST | `/api/v1/coupons/{id}/download` | 쿠폰 받기 |
| POST | `/api/v1/reservations` | 예약 생성(결제 전/후는 PG 정책에 맞게) |
| POST | `/api/v1/payments/toss/prepare` 등 | 토스페이 결제 의도 생성 — 실제 PG 연동 시 |

### `/signup/profile` — 프로필 이미지

| 제안 Method | 제안 Path | 목적 |
|-------------|-----------|------|
| POST | `/api/v1/uploads/profile` (multipart) | 업로드 후 `profileImageRef` 반환 — `completeSignup`에 전달 |

### 공통 (향후)

| 제안 Method | 제안 Path | 목적 |
|-------------|-----------|------|
| GET | `/api/v1/users/me` | 헤더 프로필·알림 뱃지 등 로그인 후 상태 |
| GET | `/api/v1/users/me/reservations/summary` | 헤더「예약」배지 등 |

---

## 4. 유지보수 방법

1. **새 엔드포인트 추가 시** `src/api/`에 모듈을 두고 `getJson`/`postJson`만 사용하면 공통 래퍼·헤더가 자동 적용됩니다.
2. **타입**은 `src/types/`에 두고 API 모듈에서 import하는 패턴을 권장합니다 (`auth`와 동일).
3. 이 문서는 엔드포인트 추가·변경 시 함께 갱신하는 것이 좋습니다.

---

## 5. 빠른 체크리스트 (백엔드 작업용)

**필수 (이미 프론트에서 호출 중)**  
`§2` 테이블 12개 엔드포인트 + `§1` 응답 래퍼·(선택) 게이트웨이 헤더.

**홈·검색·공간·예약 UI 완성용**  
`§3` 표 전체를 백로그로 두고 우선순위를 나누면 됩니다.
