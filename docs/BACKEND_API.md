# 밴더(bander_fe) 백엔드 API 명세서 (전달용)

이 문서는 **프론트엔드 코드베이스(`src/`)를 기준**으로 작성되었습니다. 백엔드 팀이 구현·우선순위를 잡을 때 그대로 넘길 수 있도록 **유즈케이스(왜 필요한지, 목적)**와 **구체적인 HTTP 계약(경로, 메서드, 본문/응답 필드)**을 함께 적습니다.

| 구분 | 설명 |
|------|------|
| **이미 연동됨** | `src/api/auth.ts`에서 `getJson` / `postJson`으로 호출 중인 인증 API |
| **미연동** | `src/data/*` 목업만 있는 기능 — 동일 UX를 서비스하려면 아래 API가 필요 |

경로 접두사는 예시로 `/api/v1`을 씁니다. 팀 표준에 맞게 통일하면 됩니다.

---

## 유즈케이스 3축 API 명세 (요약)

백엔드와 우선 논의할 때 **회원가입 / 탐색 / 예약** 단위로 묶은 계약 목록입니다. 필드·응답 상세는 아래 절(UC-01 …)과 동일합니다.

### 1. 회원가입·계정 관련

| 연동 | Method | Path | 용도 |
|:----:|--------|------|------|
| ✅ | POST | `/api/v1/auth/signup/request` | 가입 이메일로 인증 코드 발송 요청 |
| ✅ | POST | `/api/v1/auth/signup/resend` | 인증 코드 재발송 |
| ✅ | POST | `/api/v1/auth/signup/verify` | 코드 검증 → `verifiedEmailToken` |
| ✅ | POST | `/api/v1/auth/signup/registration` | 비밀번호 설정 → `signupCompletionToken` |
| ✅ | GET | `/api/v1/auth/signup/terms` | 약관 목록(버전·필수 여부·내용 URL) |
| ✅ | GET | `/api/v1/auth/signup/nickname/availability?nickname=` | 닉네임 중복 여부 |
| ✅ | POST | `/api/v1/auth/signup/completion` | 프로필·지역·이미지 ref·약관 동의로 가입 완료 |
| ✅ | POST | `/api/v1/auth/login` | 로그인 → `gatewayContextToken` 등 |
| ✅ | POST | `/api/v1/auth/password/reset/request` | 비번 재설정 인증 요청 |
| ✅ | POST | `/api/v1/auth/password/reset/resend` | 재설정 코드 재발송 |
| ✅ | POST | `/api/v1/auth/password/reset/verify` | 코드 검증 → `passwordResetToken` |
| ✅ | POST | `/api/v1/auth/password/reset/confirm` | 새 비밀번호 확정 |
| ⬜ | POST | `/api/v1/auth/logout` | (선택) 서버 세션 무효화 |
| ⬜ | `§17` | 파일 업로드 (프로필 이미지) | `profileImageRef` 발급 — 가입 완료·프로필에 사용 |

**공통 응답**: `§1` — `{ success, data, error, timestamp }` 래퍼. 타입 소스: `src/types/authApi.ts`, 호출: `src/api/auth.ts`.

---

### 2. 탐색 관련 (홈·검색·지도·상세 랜딩)

| 연동 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/home/feed` | 메인 홈 추천·핫글·카테고리 등 (`/` 연동) |
| ⬜ | GET | `/api/v1/search/spaces` | 통합 검색 — 공간 탭 (`q`, `sort`, `page`, `size`) |
| ⬜ | GET | `/api/v1/search/vendors` | 통합 검색 — 업체 탭 |
| ⬜ | GET | `/api/v1/search/posts` | 통합 검색 — 커뮤니티 탭 |
| ⬜ | GET | `/api/v1/search/suggestions?prefix=` | 검색어 자동완성 (선택) |
| ⬜ | GET | `/api/v1/explore/map/markers` | 지도 뷰포트·필터 기준 마커(클러스터/개수) |
| ⬜ | GET | `/api/v1/explore/map/spaces` | 지도 좌측 리스트 (동일 필터, 페이징) |
| ⬜ | GET | `/api/v1/explore/map/popular-vendors` | 탐색 인기 업체 칩/캐러셀 (선택) |
| ⬜ | GET | `/api/v1/spaces/{slug}` | 공간 상세 (예약 전 정보) |
| ⬜ | GET | `/api/v1/vendors/{slug}` | 업체 상세·소속 룸 목록 |
| ⬜ | GET | `/api/v1/meta/regions` 등 | `§18` 필터 메타(지역·공간 유형) — 탐색 필터와 동기화 |

지도 쿼리 예: `minLat`, `maxLat`, `minLng`, `maxLng`, `regionIds`, `spaceTypes[]`, `date`, `startHour`, `endHour`, `people`, `keywords[]`, `reservableOnly`, `parkingOnly`.

---

### 3. 예약 관련

| 연동 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/spaces/{slug}/calendar` | 예약 캘린더 — 예약 가능 일자 (`month=YYYY-MM`) |
| ⬜ | GET | `/api/v1/spaces/{slug}/availability` | 특정 일의 시간 슬롯·가격·재고 (`date=`) |
| ⬜ | GET | `/api/v1/spaces/{slug}/options` | 추가 옵션(악기 등) 목록 |
| ⬜ | POST | `/api/v1/reservations` | 예약 생성(슬롯 선점) — 쿠폰·옵션·메모 |
| ⬜ | POST | `/api/v1/payments/{provider}/confirm` | PG 결제 검증(선택, 토스 등) |
| ⬜ | GET | `/api/v1/users/me/reservations` | 내 예약 목록 (`tab`, `page`, `size`) |
| ⬜ | GET | `/api/v1/reservations/{id}` | 예약 상세 |
| ⬜ | POST | `/api/v1/reservations/{id}/cancel` | 예약 취소 |

예약 플로우 UI: `SpaceReservationPage`, `MyReservationsPage`, 예약 상세. 결제 객체 스키마는 사용 PG와 합의 후 `§8` 본문과 맞출 것.

---

**상세 절 맵**: 1→`§2`(UC-01~03), 2→`§3~7`·`§18`(UC-04~08,19), 3→`§6` 일부·`§8~9`(UC-07 캘린더, UC-09~10).

## 목차

- **유즈케이스 3축 요약**: [회원가입·탐색·예약](#유즈케이스-3축-api-명세-요약) (문서 상단)
1. [HTTP 공통 규약](#1-http-공통-규약)
2. [UC-01 ~ UC-03 계정·인증](#2-uc-01--uc-03-계정·인증-이미-프론트-연동-중)
3. [UC-04 홈·발견](#3-uc-04-홈·발견)
4. [UC-05 통합 검색](#4-uc-05-통합-검색)
5. [UC-06 지도 탐색](#5-uc-06-지도-탐색)
6. [UC-07 공간(룸) 상세](#6-uc-07-공간룸-상세)
7. [UC-08 업체(벤더) 상세](#7-uc-08-업체벤더-상세)
8. [UC-09 예약·결제](#8-uc-09-예약·결제)
9. [UC-10 내 예약](#9-uc-10-내-예약)
10. [UC-11 리뷰](#10-uc-11-리뷰)
11. [UC-12 프로필 편집](#11-uc-12-프로필-편집)
12. [UC-13 계정 설정·비밀번호](#12-uc-13-계정-설정·비밀번호)
13. [UC-14 알림](#13-uc-14-알림)
14. [UC-15 결제 정보·내역](#14-uc-15-결제-정보·내역)
15. [UC-16 쿠폰](#15-uc-16-쿠폰)
16. [UC-17 로그인 후 헤더·요약](#16-uc-17-로그인-후-헤더·요약)
17. [UC-18 파일 업로드](#17-uc-18-파일-업로드-프로필-이미지-등)
18. [UC-19 필터 메타(지역·공간 유형 등)](#18-uc-19-필터-메타지역·공간-유형-등)
19. [에러·페이징 권장사항](#19-에러·페이징-권장사항)
20. [프론트 코드 참조 맵](#20-프론트-코드-참조-맵)

---

## 1. HTTP 공통 규약

### 1.1 목적

프론트의 단일 HTTP 클라이언트(`src/api/client.ts`)가 **응답 형식·인증 헤더·401 처리**를 한곳에서 맡습니다. 백엔드가 이 규약을 지키지 않으면 프론트 수정 없이는 연동이 깨집니다.

### 1.2 Base URL

- 환경 변수 `REACT_APP_API_BASE_URL` (없으면 빈 문자열 → 개발 시 CRA `package.json`의 `proxy`로 상대 경로)
- 프로덕션에서는 반드시 명시적 Base URL 권장

### 1.3 요청

- `Content-Type: application/json` (JSON 본문)
- **인증(로그인 후)**  
  - `sessionStorage`에 저장된 `gatewayContextToken`이 있으면 다음 헤더를 붙입니다.  
  - `X-Gateway-Context: <gatewayContextToken>`  
  - `X-Gateway-Auth: <REACT_APP_GATEWAY_AUTH_TOKEN 또는 기본값 local-dev-gateway-token>`  
- 백엔드가 **Bearer JWT만** 쓴다면, 게이트웨이 레이어에서 위 헤더를 검증하거나 프론트 `buildHeaders`를 확장하는 식으로 정합이 필요합니다.

### 1.4 응답 래퍼 (필수)

모든 JSON 응답은 아래 형태를 권장합니다. 프론트는 **`success === true`이고 `data`가 있을 때만** `data`를 반환합니다.

```json
{
  "success": true,
  "data": { },
  "timestamp": "2026-04-03T12:00:00Z"
}
```

실패 시:

```json
{
  "success": false,
  "error": {
    "code": "SOME_CODE",
    "message": "사용자에게 보여줄 메시지"
  },
  "timestamp": "2026-04-03T12:00:00Z"
}
```

- HTTP 상태코드: 4xx/5xx와 함께 위 본문을 주는 것을 권장
- **401**: 프론트가 `clearAuthSession()` 호출 후 에러 throw — 재로그인 유도

### 1.5 ID 타입 정책 (중요 — 백엔드 준수 필수)

**식별자(ID) 시맨틱 필드에 한해** JSON `string`으로 직렬화합니다. **수치(count, price, 좌표, rating 등)는 기존대로 JSON number를 유지**하며, 전역으로 `Long`→`String` 매핑을 켜지 않습니다.

**왜?**
- JavaScript의 `Number`는 IEEE-754 double이라 `2^53 - 1 = 9007199254740991` 이상 정수에서 정밀도가 손실됩니다 (`JSON.parse('{"id": 9007199254740993}')` → `9007199254740992`).
- 스노우플레이크/타임스탬프 기반 ID, auto-increment `BIGINT`가 2^53 임계를 넘으면 클라이언트가 **잘못된 ID**로 서버를 호출해 예약 취소/댓글 삭제 등이 엉뚱한 리소스에 꽂히는 버그가 발생합니다.
- 반면 카운트·가격·좌표·별점은 범위가 작고 FE가 `number`로 수신하는 것을 전제로 UI가 작성되어 있어, 전역으로 `Long`을 문자열화하면 기존 계약이 전부 깨집니다.

**적용 대상 (문자열화 해야 하는 ID 필드)**

FE 스키마(`src/data/schemas/*.ts`, `src/api/*.ts`)에서 이미 `string`으로 타이핑되어 있는 아래 계열의 필드가 해당. 서버도 동일하게 `String`으로 내려야 함:

`userId`, `authorUserId`, `ownerUserId`, `postId`, `commentId`, `parentId`, `bookingId`, `reservationId`, `roomId`(=spaceId), `studioId`, `vendorId`, `couponId`, `ownedCouponId`, `messageId`, `reviewId`, `orderId`, `paymentId`, `mediaRef`/`profileImageRef` 등 reference 키, 그리고 `id` 필드가 DB PK를 드러내는 경우 전부.

**적용하지 않는 대상 (그대로 JSON number 유지)**

`reviewCount`, `likeCount`, `commentCount`, `viewCount`, `unreadCount`, `pricePerSlot`, `points`/`pointBalance`/`amount`, `latitude`, `longitude`, `rating`, `pageIndex`, `totalCount` 등 의미상 **카운트·금액·좌표·평점·페이지 번호**. 이 값들은 2^53을 넘을 일이 없고, FE에서 산술 연산에 사용됩니다.

**규칙**
1. 전역 `ObjectMapper` 설정(`StdSerializers.Long` / `SimpleModule.addSerializer(Long.class, ToStringSerializer.instance)`)처럼 **모든 Long을 문자열로 바꾸는 설정은 사용 금지**. (기존 수치 필드까지 문자열이 되어 프론트 파싱이 깨진다.)
2. 대신 **필드 단위로** `@JsonSerialize(using = ToStringSerializer.class)` 또는 **타입 래퍼 도입** 중 하나:
   - (a) DTO 각 ID 필드에 어노테이션: `@JsonSerialize(using = ToStringSerializer.class) Long id;`
   - (b) 전용 ID 래퍼 타입(예: `record EntityId(long value)`) + `JsonComponent`로 직렬화. 이후 DTO는 래퍼 타입만 사용.
3. 요청 본문/경로 파라미터의 ID는 `String` 타입으로 수신(서버에서 `Long.parseLong()`). URL 예시: `/api/v1/posts/{postId}` → `"19283712..."` 형태의 문자열 파라미터.
4. FE는 `id: string`을 이미 전제하므로 변경 불필요. 만약 일부 엔드포인트가 아직 `number`로 내려준다면 **그 엔드포인트만** 문자열로 바꾸고, 같은 PR에서 카운트·가격·좌표 필드가 변형되지 않았는지 회귀 확인.

**검증**
- 샘플 응답에서 ID 필드만 따옴표로 감싸져 있고(`"postId":"9007199254740993"`), 카운트/금액은 숫자 그대로(`"likeCount":189`, `"pricePerSlot":10000`)인지 확인.
- FE에서 `typeof id === 'string'` 가드를 기본으로 가정. 숫자 ID 수신을 대비한 파싱 로직은 두지 않음(서버가 약속을 지킨다는 전제).

---

## 2. UC-01 ~ UC-03 계정·인증 (이미 프론트 연동 중)

### UC-01 회원가입 (이메일 인증 → 비밀번호 → 프로필 → 약관 동의)

| 항목 | 내용 |
|------|------|
| **프론트** | `/signup` → `/signup/profile` → `/signup/terms` · `src/pages/Signup*.tsx` · `src/api/auth.ts` |
| **왜 필요한가** | 가입자의 이메일 소유 확인, 비밀번호 설정, 필수 약관 동의를 **단계적으로** 처리해 보안·규정 요구를 만족시키기 위함. |
| **목적** | 신규 사용자 계정 생성 및 법적 동의 기록. |

구체 계약은 아래 표와 `src/types/authApi.ts`가 소스 오브 트루스입니다.

| Method | Path | Request body | Response `data` 타입 |
|--------|------|--------------|----------------------|
| POST | `/api/v1/auth/signup/request` | `{ "email": "string" }` | `VerificationIssueResponse`: `dispatchType`, `expiresAt`, `resendAvailableAt` |
| POST | `/api/v1/auth/signup/resend` | `{ "email": "string" }` | 동일 |
| POST | `/api/v1/auth/signup/verify` | `{ "email", "verificationCode" }` | `verifiedEmailToken`, `expiresAt` |
| POST | `/api/v1/auth/signup/registration` | `{ "verifiedEmailToken", "password", "passwordConfirm" }` | `signupCompletionToken`, `userId`, `status`, `expiresAt` |
| GET | `/api/v1/auth/signup/terms` | — | `SignupTermResponse[]`: `termCode`, `version`, `title`, `required`, `effectiveAt`, `contentUrl` |
| GET | `/api/v1/auth/signup/nickname/availability?nickname=` | — | `{ "available": boolean }` |
| POST | `/api/v1/auth/signup/completion` | `{ "signupCompletionToken", "nickname", "gender": "MALE"\|"FEMALE"\|"PREFER_NOT_TO_SAY", "regionCode", "profileImageRef", "consents": [{ "termCode", "version", "agreed" }] }` | `{ "userId", "status" }` |

- `profileImageRef`: 업로드 API(§17)에서 받은 참조 문자열. 없으면 빈 문자열/omit 정책은 백엔드와 합의.

### UC-02 로그인

| 항목 | 내용 |
|------|------|
| **프론트** | `/login` · `LoginPage.tsx` · `login()` |
| **왜 필요한가** | 이후 모든 개인화(예약, 리뷰, 알림)의 전제가 되는 **신원 증명**. |
| **목적** | 세션(게이트웨이 컨텍스트 토큰) 발급. |

| Method | Path | Request | Response `data` |
|--------|------|---------|-----------------|
| POST | `/api/v1/auth/login` | `{ "email", "password" }` | `LoginResponse`: `userId` (number), `expiresAt` (ISO8601), `gatewayContextToken` (string) |

- 개발용: `src/config/devLogin.ts`의 우회가 있을 수 있음 — 프로덕션에서는 무시.

### UC-03 비밀번호 재설정

| 항목 | 내용 |
|------|------|
| **프론트** | `/forgot-password`, `/forgot-password/reset` |
| **왜 필요한가** | 로그인 불가 사용자의 **계정 복구** (가입 플로우와 분리된 보안 경로). |
| **목적** | 이메일 인증 후 새 비밀번호로 갱신. |

| Method | Path | Request | Response `data` |
|--------|------|---------|-----------------|
| POST | `/api/v1/auth/password/reset/request` | `{ "email" }` | `VerificationIssueResponse` |
| POST | `/api/v1/auth/password/reset/resend` | `{ "email" }` | 동일 |
| POST | `/api/v1/auth/password/reset/verify` | `{ "email", "verificationCode" }` | `passwordResetToken`, `expiresAt` |
| POST | `/api/v1/auth/password/reset/confirm` | `{ "passwordResetToken", "password", "passwordConfirm" }` | `{ "userId" }` |

### UC-03b 로그아웃 (선택)

| 항목 | 내용 |
|------|------|
| **프론트** | 헤더 프로필 메뉴 → `clearAuthSession()` 만 호출 (서버 호출 없음) |
| **왜 필요한가** | 서버 측 토큰/세션 무효화, 다중 기기 로그아웃. |
| **목적** | 보안 강화 시 권장. |

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/api/v1/auth/logout` | (본문 없음 또는 refresh 토큰) | `{ "ok": true }` 등 — 성공 시 프론트는 기존처럼 스토리지 삭제 |

---

## 3. UC-04 홈·발견

### 배경·목적

첫 화면(`/`, `/home-auth`)에서 사용자가 **커뮤니티 콘텐츠·공간·후기**를 한 번에 스캔하고 탐색으로 이어지게 합니다. 지금은 `src/data/home.ts`의 정적 배열입니다.

### 왜 API가 필요한가

- 실시간 인기 게시글·추천 공간 반영
- 운영 배너/이벤트 교체
- A/B·개인화(추후)

### 제안 API

#### GET `/api/v1/home/feed`

**목적**: 메인 섹션에 필요한 데이터를 **한 번에** 내려 네트워크 왕복을 줄임 (또는 리소스별로 쪼개도 됨).

**인증**: 선택(비로그인도 기본 피드, 로그인 시 개인화 필드 추가 가능)

**Response `data` 예시 (스키마)**

```json
{
  "hotPosts": [
    {
      "id": "string",
      "category": "string",
      "title": "string",
      "author": "string",
      "likes": 0,
      "comments": 0,
      "thumbnailUrl": "string|null",
      "detailPath": "/community/posts/{id}"
    }
  ],
  "recommendedSpaces": [
    {
      "slug": "string",
      "title": "string",
      "subtitle": "string",
      "studio": "string",
      "location": "string",
      "price": "string",
      "rating": "string",
      "imageUrl": "string",
      "detailPath": "/spaces/{slug}"
    }
  ],
  "reviewCards": [
    {
      "id": "string",
      "author": "string",
      "date": "string",
      "rating": "string",
      "text": "string",
      "spaceTitle": "string",
      "imageUrl": "string|null"
    }
  ],
  "categoryBubbles": [
    { "label": "string", "accentHex": "string", "searchQueryOrTag": "string" }
  ]
}
```

필드명은 프론트 `HOME_HOT_POSTS`, `HOME_SPACE_CARDS`, `HOME_REVIEW_CARDS`, `HOME_CATEGORY_BUBBLES`와 매핑 가능해야 합니다.

---

## 4. UC-05 통합 검색

### 배경·목적

`/search?q=` 에서 **공간 / 업체 / 커뮤니티** 탭별로 같은 검색어로 결과를 보여 줍니다 (`SearchResultsPage.tsx`).

### 왜 API가 필요한가

- 전체 카탈로그·게시글 DB 기반 검색
- 정렬·페이지네이션·하이라이트

### 제안 API (탭별 분리가 명확함)

공통 쿼리: `q` (필수), `sort` (옵션), `page`, `size` 또는 `cursor`

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/search/spaces` | `q`, `sort`, `page`, `size` |
| GET | `/api/v1/search/vendors` | 동일 |
| GET | `/api/v1/search/posts` | 동일 |

**Response `data` 공통 골격**

```json
{
  "items": [],
  "totalCount": 0,
  "page": 1,
  "size": 20,
  "hasNext": false
}
```

**공간 아이템 예시**

```json
{
  "slug": "a-room-grand-piano-rental",
  "title": "string",
  "studioName": "string",
  "location": "string",
  "priceLabel": "string",
  "rating": "4.5",
  "thumbnailUrl": "string",
  "tags": ["주차가능", "예약가능"]
}
```

**업체 아이템 예시**

```json
{
  "slug": "youth-music",
  "name": "string",
  "spaceCountLabel": "15개의 공간",
  "thumbnailOrTone": "string"
}
```

**게시글 아이템 예시**

```json
{
  "id": "string",
  "category": "string",
  "title": "string",
  "excerpt": "string",
  "likes": 0,
  "thumbnailStyle": "string|null"
}
```

#### GET `/api/v1/search/suggestions?prefix=` (선택)

헤더/메인 검색 자동완성용 — `HEADER_SEARCH_KEYWORD_SUGGESTIONS` 대체.

---

## 5. UC-06 지도 탐색

### 배경·목적

`/search/map` — 지도 위 마커와 좌측 리스트로 **위치 기반 탐색** (`ExploreMapPage.tsx`, `src/data/exploreMap.ts`). 필터는 `HomeSpaceExplorer variant="map"`과 동일 UX로 메인과 맞춤.

### 왜 API가 필요한가

- 실제 좌표·클러스터·이용 가능 룸 수(배지 2,3,4,5+)는 서버 집계가 자연스럽습니다.
- 필터 조건을 쿼리로 보내 리스트·마커를 일치시켜야 합니다.

### 제안 API

#### GET `/api/v1/explore/map/markers`

**Query 예시**: `minLat`, `maxLat`, `minLng`, `maxLng`, `regionIds`, `spaceTypes[]`, `date`, `startHour`, `endHour`, `people`, `keywords[]`, `reservableOnly`, `parkingOnly`

**Response `data`**

```json
{
  "markers": [
    {
      "id": "string",
      "lat": 37.55,
      "lng": 126.92,
      "availableRoomCount": 3,
      "spaceOrVendorId": "string",
      "label": "string"
    }
  ]
}
```

- `availableRoomCount`: 프론트가 `formatExploreMapAvailableRoomsLabel`로 2,3,4,5+ 배지 표시.

#### GET `/api/v1/explore/map/spaces`

동일 필터로 **사이드바 리스트**용. 페이지네이션 포함.

**아이템 예시** (목업 `ExploreMapListItem`과 호환)

```json
{
  "detailPath": "/spaces/{slug}",
  "imageUrl": "string",
  "spaceType": "합주실",
  "studio": "string",
  "title": "string",
  "rating": "4.5",
  "location": "string",
  "priceLabel": "10,000원",
  "priceSuffix": "/60분",
  "tags": ["주차가능", "예약가능"],
  "bookmarkSaved": false
}
```

#### GET `/api/v1/explore/map/popular-vendors` (선택)

인기 업체 캐러셀 — 또는 홈 피드와 통합.

---

## 6. UC-07 공간(룸) 상세

### 배경·목적

`/spaces/:slug` — 예약 전 **가격·운영·정책·사진·리뷰**를 확인 (`SpaceDetailPage.tsx`, `useSpaceDetail`, `src/data/spaceDetail.ts`, `types/space.ts`).

### 왜 API가 필요한가

- 룸별 동적 데이터
- 리뷰·재고·쿠폰 수 실시간 반영

### 제안 API

#### GET `/api/v1/spaces/{slug}`

**인증**: 선택 (로그인 시 북마크·쿠폰 개인화)

**Response `data` (필드 가이드)**

```json
{
  "slug": "string",
  "title": "string",
  "category": "string",
  "studioName": "string",
  "vendorSlug": "string",
  "location": "string",
  "address": "string",
  "addressTransitHint": "string",
  "stationDistanceLabel": "string",
  "rating": "5.0",
  "reviewCount": 412,
  "priceLabel": "10,000원~",
  "priceSuffix": "/60분",
  "summaryPriceLines": [{ "label": "이용금액", "value": "string" }],
  "hashTags": ["#피아노"],
  "operatingSummary": "string",
  "operatingWeek": [{ "weekday": "월", "hours": "06:00 - 23:00", "isToday": false }],
  "galleryUrls": ["string"],
  "facilityChips": [{ "key": "parking", "label": "주차가능" }],
  "detailBenefitChips": [{ "label": "커피" }],
  "notices": [{ "title": "string", "body": "string" }],
  "policies": [{ "title": "string", "body": "string" }],
  "description": "string",
  "couponStripLabel": "적용 가능 쿠폰 3",
  "trustBanner": "string",
  "reviewPreview": [
    { "author": "string", "date": "string", "rating": "string", "text": "string", "photoCount": 0 }
  ],
  "recommendations": []
}
```

#### GET `/api/v1/spaces/{slug}/reviews` (선택)

페이지네이션 분리 시.

#### POST `/api/v1/spaces/{slug}/bookmarks` · DELETE 동일 (또는 POST toggle)

스크랩 버튼 — UI에 존재.

#### GET `/api/v1/spaces/{slug}/calendar`

**Query**: `month=2026-04`  
**목적**: 예약 캘린더의 가능 일자 표시 (현재 정적).

**Response 예시**

```json
{
  "yearMonth": "2026-04",
  "bookableDayOfMonth": [1, 2, 3, 13]
}
```

---

## 7. UC-08 업체(벤더) 상세

### 배경·목적

`/vendors/:slug` — 한 업체가 운영하는 **룸 목록·리뷰·기본 정보** (`VendorDetailPage.tsx`, `src/data/vendorDetail.ts`, `types/vendorBasicInfo.ts`).

### 왜 API가 필요한가

- 업체 단위 랜딩·SEO·룸 집합 표시

### 제안 API

#### GET `/api/v1/vendors/{slug}`

**Response `data` (개략)**

```json
{
  "slug": "string",
  "name": "string",
  "description": "string",
  "heroImageUrl": "string",
  "mapImageUrl": "string",
  "distanceLabel": "string",
  "fullAddress": "string",
  "hashTags": ["#합주실"],
  "reviewCountLabel": "48개의 리뷰",
  "reviewSectionCount": 32,
  "policyLinkLabel": "이용정책 확인",
  "timeNote": "최소 30분 단위로 선택",
  "basicInfoRows": [
    { "field": "address", "primaryLine": "string", "secondaryLine": "string" }
  ],
  "rooms": [
    {
      "detailPath": "/spaces/{slug}",
      "title": "string",
      "categoryLabel": "합주실",
      "imageUrl": "string",
      "location": "string",
      "priceLabel": "string",
      "priceSuffix": "/60분",
      "rating": "string",
      "studioLabel": "string",
      "tags": ["주차가능", "예약가능"]
    }
  ],
  "reviews": []
}
```

`getVendorDetail` 분기(`youth-music`, `banggu-musician`, `chats-music`, aggregate slug)는 백엔드에서 단일 스키마로 통일하는 것이 유지보수에 유리합니다.

---

## 8. UC-09 예약·결제

### 배경·목적

`/spaces/:slug/reserve` — 날짜·시간·옵션·쿠폰·결제(토스페이 UI)까지 **예약 확정** (`SpaceReservationPage.tsx`).

### 왜 API가 필요한가

- 재고(슬롯) 선점·이중 예약 방지
- PG 연동·환불 규정과 연계

### 제안 API

#### GET `/api/v1/spaces/{slug}/availability`

**Query**: `date=2026-04-03`  
**Response `data`**

```json
{
  "date": "2026-04-03",
  "slots": [
    {
      "startTime": "16:00",
      "endTime": "17:00",
      "bookable": true,
      "priceWon": 10000,
      "slotId": "string"
    }
  ],
  "timezone": "Asia/Seoul"
}
```

#### GET `/api/v1/spaces/{slug}/options`

추가 옵션(드럼 등) — `SpaceReservationPage` 내 로컬 목록 대체.

```json
{
  "options": [
    { "id": "opt1", "name": "string", "priceWon": 5000, "imageUrl": "string" }
  ]
}
```

#### POST `/api/v1/reservations`

**Request**

```json
{
  "spaceSlug": "string",
  "slotId": "string",
  "optionIds": ["opt1"],
  "couponIds": ["string"],
  "note": "string"
}
```

**Response**

```json
{
  "reservationId": "string",
  "status": "PENDING_PAYMENT|CONFIRMED",
  "payment": {
    "provider": "TOSS",
    "clientKey": "string",
    "orderId": "string",
    "amountWon": 15000
  }
}
```

실제 PG 플로우(토스 SDK)에 맞게 `payment` 객체는 조정.

#### POST `/api/v1/payments/{provider}/confirm` (선택)

프론트가 PG 성공 콜백 후 서버 검증.

---

## 9. UC-10 내 예약

### 배경·목적

`/my-reservations`, `/reservation-detail` — 사용자의 **예약 목록·상세·취소·리뷰 진입** (`myReservations.ts`, `reservationDetail.ts`).

### 왜 API가 필요한가

- 서버가 소유하는 예약 상태가 단일 진실 공급원

### 제안 API

#### GET `/api/v1/users/me/reservations`

**Query**: `tab=upcoming|past|canceled`, `page`, `size`

**아이템** (`MyReservation` 모델과 대응)

```json
{
  "id": "string",
  "tab": "upcoming",
  "status": "confirmed|pending|completed|canceledUser|canceledVendor",
  "reservationNo": "string",
  "headlineRight": "string|null",
  "headlineAccent": "primary|muted|null",
  "spaceTitle": "string",
  "vendorName": "string",
  "thumbUrl": "string",
  "dateTimeLine": "string",
  "durationLine": "string",
  "detailPath": "/reservation-detail?id=...",
  "action": "cancel|writeReview|viewMyReview|none",
  "detailRows": [{ "label": "string", "value": "string" }]
}
```

#### GET `/api/v1/reservations/{id}`

상세 화면 전용 풀 필드.

#### POST `/api/v1/reservations/{id}/cancel`

**Request**: `{ "reason": "string|null" }`  
**Response**: 갱신된 예약 객체 또는 `{ "status": "canceledUser" }`

---

## 10. UC-11 리뷰

### 배경·목적

`/review/write`, `/my-reviews` — 이용 후 **리뷰 작성·내 리뷰 관리·삭제·상세 보기** (`ReviewWritePage`, `MyReviewsPage`, `reviewWriteDemo.ts`, `myReviews.ts`).

### 왜 API가 필요한가

- 신뢰도·검색 품질·업체 피드백 루프

### 제안 API

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/reviews` | `{ "reservationId", "rating": 1-5, "text", "imageRefs": [] }` |
| GET | `/api/v1/users/me/reviews` | 내 리뷰 목록 |
| GET | `/api/v1/reviews/{id}` | 단건 (모달) |
| DELETE | `/api/v1/reviews/{id}` | 소프트 삭제 시 `deletedAt` |

---

## 11. UC-12 프로필 편집

### 배경·목적

`/profile/edit` — 닉네임·이미지·소개·장르/악기·SNS (`profileEdit.ts`, `profileGenreInstrument.ts`).

### 왜 API가 필요한가

- 커뮤니티 신원·추천에 쓰이는 공개 프로필

### 제안 API

#### GET `/api/v1/users/me/profile`

#### PATCH `/api/v1/users/me/profile`

**Request 예시**

```json
{
  "nickname": "string",
  "bio": "string",
  "profileImageRef": "string",
  "genreIds": ["string"],
  "instrumentIds": ["string"],
  "sns": { "instagram": "string", "youtube": "string" }
}
```

필드는 프론트 폼과 1:1 매핑되도록 합의.

---

## 12. UC-13 계정 설정·비밀번호

### 배경·목적

`/account/settings` — 이메일/연락처 표시, 탈퇴, 비밀번호 변경 모달 (`AccountSettingsPage`, `ChangePasswordModal`).

### 왜 API가 필요한가

- 민감 설정은 서버 권한으로만 변경

### 제안 API

#### GET `/api/v1/users/me/account`

계정 식별자·마스킹된 이메일/전화.

#### POST `/api/v1/users/me/password`

**Request**: `{ "currentPassword", "newPassword", "newPasswordConfirm" }`

#### POST `/api/v1/users/me/deactivate` 또는 `DELETE /api/v1/users/me`

탈퇴 플로우 — 정책에 따라 유예 기간.

---

## 13. UC-14 알림

### 배경·목적

`/notifications`, `/notification-settings` — 알림 센터·채널 설정 (`notifications.ts`, `notificationSettings.ts`).

### 왜 API가 필요한가

- 푸시/이메일/인앱과 동기화, 읽음 처리

### 제안 API

#### GET `/api/v1/notifications`

**Query**: `category=all|activity|news`, `cursor`

**아이템** (`AppNotification`)

```json
{
  "id": "string",
  "category": "activity|news",
  "icon": "like|bell|comment|gift",
  "message": "string",
  "section": "today|week",
  "timeLabel": "string",
  "thumbUrl": "string|null",
  "cta": { "href": "string", "label": "string" },
  "read": false
}
```

#### PATCH `/api/v1/notifications/{id}/read`

#### GET `/api/v1/users/me/notification-settings`

#### PUT `/api/v1/users/me/notification-settings`

```json
{
  "channels": {
    "pushReservation": true,
    "pushCommunity": true,
    "emailMarketing": false
  }
}
```

(실제 키는 제품 정책에 맞게)

#### SSE 실시간 스트림 `/api/v1/notifications/stream` ⬜ FE 미연동

- **Transport**: `Content-Type: text/event-stream`. 게이트웨이(edge-gateway)는 SSE 프록시 지원(`FlushInterval=-1`).
- **인증**: 기존 세션 쿠키/게이트웨이 컨텍스트 토큰 그대로 사용. `EventSource`는 기본적으로 `withCredentials: true`로 열어야 함.
- **이벤트 타입(권장)**:
  - `event: notification.created` — 신규 알림 1건 (`AppNotification` JSON)
  - `event: notification.read` — 특정 ID 읽음 처리 (`{ id }`)
  - `event: unread.count` — 미확인 카운트 변경 (`{ count }`)
- **재연결**: 서버는 `retry: 3000` hint. 클라이언트는 지수 백오프(2s → 4s → … → 30s)로 재시도하고, 401/세션 만료 시 스트림 종료.

**FE 작업 현황**: `src/api/notifications.ts`에 REST 4개(`list`, `unread-count`, `read`, `read-all`)만 구현되어 있고 **SSE 구독 코드는 아직 없음(⬜)**. 추가 시 `src/api/notificationsStream.ts` 같은 별도 파일에 `subscribeNotifications(onEvent, onError)` 형태로 래퍼를 두고, 최상위 레이아웃(`HomeHeader` 또는 App 루트)에서 인증된 세션일 때만 구독·해제하도록 연결.

**FE 수신 시 처리**:
- `notification.created` → 헤더 뱃지 카운트 +1, 현재 `/notifications` 페이지가 열려있으면 목록 prepend
- `notification.read` → 헤더 뱃지 카운트 -1, 현재 목록의 해당 항목 `read:true`로 업데이트
- `unread.count` → 헤더 뱃지 숫자 덮어쓰기 (서버가 신뢰할 수 있는 카운트)

---

## 14. UC-15 결제 정보·내역

### 배경·목적

`/payment-info` — 등록 카드(마스킹)·결제/환불 내역 (`paymentInfo.ts`).

### 왜 API가 필요한가

- PG에 저장된 수단·거래 이력 조회

### 제안 API

#### GET `/api/v1/users/me/payment-methods`

```json
{
  "methods": [
    { "id": "string", "brand": "VISA", "last4": "1234", "isDefault": true }
  ]
}
```

#### GET `/api/v1/users/me/payment-history`

**Query**: `page`, `size`

**아이템**

```json
{
  "id": "string",
  "kind": "payment|refund",
  "title": "string",
  "dateLabel": "string",
  "amountWon": 15000
}
```

---

## 15. UC-16 쿠폰

### 배경·목적

공간 상세·예약 플로우의 **쿠폰 다운로드·적용** (`couponDownloadModal.ts`, `useCouponDownloads.ts` — 현재는 로컬스토리지만).

### 왜 API가 필요한가

- 캠페인·재고·중복 다운로드 제한

### 제안 API

#### GET `/api/v1/coupons/available`

**Query**: `spaceSlug` 또는 `context=space:{slug}`

#### POST `/api/v1/coupons/{couponId}/claim`

**Response**: `{ "ownedCouponId": "string" }`

#### GET `/api/v1/users/me/coupons`

보유 목록 — 헤더 `couponCountLabel`과 연동 가능.

---

## 16. UC-17 로그인 후 헤더·요약

### 배경·목적

`HomeHeader` — 프로필 드롭다운, 예약 배지, 장바구니/찜/알림 아이콘 (`types/homeProfileMenu.ts`).

### 왜 API가 필요한가

- 숫자 배지·이름·포인트가 **항상 최신**이어야 함

### 제안 API

#### GET `/api/v1/users/me/summary`

**Response `data`**

```json
{
  "displayName": "string",
  "email": "string",
  "profileImageUrl": "string|null",
  "pointsLabel": "20,000P",
  "couponCountLabel": "3개",
  "reservationBadgeCount": 3,
  "cartCount": 8,
  "wishlistCount": 0,
  "unreadNotificationCount": 0
}
```

프론트는 `resolveHomeProfileMenuModel`에 이 응답을 매핑하면 됩니다.

---

## 17. UC-18 파일 업로드 (프로필 이미지 등)

### 배경·목적

가입 완료·프로필 수정에서 `profileImageRef` 사용.

### 왜 API가 필요한가

- 바이너리를 JSON 회원가입 본문에 넣지 않기 위함

### 제안 패턴

1. POST `/api/v1/uploads/profile/presign` → `{ "uploadUrl", "imageRef", "headers": {} }`  
2. 클라이언트가 `uploadUrl`로 PUT  
3. 이후 `profileImageRef`로 `completeSignup` / `PATCH profile` 호출  

또는 단일 **multipart** `POST /api/v1/uploads/profile` → `{ "imageRef" }`.

---

## 18. UC-19 필터 메타(지역·공간 유형 등)

### 배경·목적

`HomeSpaceExplorer` — 지역 2열, 공간 칩, 키워드 그룹 (`src/data/home.ts`의 `HOME_FILTER_*`).

### 왜 API가 필요한가

- 행정구역 변경·서비스 카테고리 확장 시 배포 없이 반영

### 제안 API

#### GET `/api/v1/meta/search-filters`

**Response 예시**

```json
{
  "regions": {
    "columns": { "left": ["서울", "…"], "right": ["경기", "…"] },
    "districtsByProvince": { "서울": ["마포구", "…"] }
  },
  "spaceTypes": ["합주실", "보컬연습실"],
  "keywordGroups": [{ "label": "악기", "options": ["#기타", "…"] }]
}
```

---

## 19. 에러·페이징 권장사항

### 에러 `error.code` 예시

- `AUTH_INVALID_CREDENTIALS`, `AUTH_EXPIRED_TOKEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`

### 페이징

- 오프셋: `page`, `size` + `totalCount`, `hasNext`
- 또는 커서: `nextCursor`, `items`

### Idempotency

- 예약 생성·결제 확인은 `Idempotency-Key` 헤더 권장.

---

## 20. 프론트 코드 참조 맵

| 영역 | 주요 경로 |
|------|-----------|
| HTTP 클라이언트 | `src/api/client.ts` |
| 인증 API | `src/api/auth.ts`, `src/types/authApi.ts` |
| 세션 저장 | `src/data/authSession.ts` |
| 라우트 | `src/App.tsx` |
| 홈 목업 | `src/data/home.ts` |
| 검색 | `src/pages/SearchResultsPage.tsx` |
| 지도 | `src/pages/ExploreMapPage.tsx`, `src/data/exploreMap.ts` |
| 공간 상세 | `src/pages/SpaceDetailPage.tsx`, `src/hooks/useSpaceDetail.ts`, `src/data/spaceDetail.ts` |
| 업체 | `src/pages/VendorDetailPage.tsx`, `src/data/vendorDetail.ts` |
| 예약 | `src/pages/SpaceReservationPage.tsx` |
| 내 예약 | `src/pages/MyReservationsPage.tsx`, `src/data/myReservations.ts` |
| 예약 상세 | `src/pages/ReservationDetailPage.tsx`, `src/data/reservationDetail.ts` |
| 리뷰 | `src/pages/ReviewWritePage.tsx`, `src/pages/MyReviewsPage.tsx`, `src/data/myReviews.ts` |
| 프로필 | `src/pages/ProfileEditPage.tsx`, `src/data/profileEdit.ts` |
| 계정 | `src/pages/AccountSettingsPage.tsx`, `src/components/account/ChangePasswordModal.tsx` |
| 알림 | `src/pages/NotificationsPage.tsx`, `src/data/notifications.ts` |
| 알림 설정 | `src/pages/NotificationSettingsPage.tsx`, `src/data/notificationSettings.ts` |
| 결제 정보 | `src/pages/PaymentInfoPage.tsx`, `src/data/paymentInfo.ts` |
| 탐색 필터 UI | `src/components/home/HomeSpaceExplorer.tsx` |
| 헤더 프로필 모델 | `src/types/homeProfileMenu.ts` |

---

## UC-MP: 최근 추가 목업 페이지 연동 가이드

2026-04-20 기준 FE에 추가된 목업 전용 페이지와, 서버 연동 시 교체해야 할 지점·계약 요약. 모든 항목은 `src/data/*.ts` 목업 → 실 API로 치환하면 UI는 그대로 동작하도록 설계되어 있습니다.

### 1) 스크랩 — `/my-scraps`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/users/me/scraps` | 저장 탭 리스트 (`OwnedSpaceCardDto[]`, 공간 카드와 동일 스키마 + `bookmarkSaved:true`) |
| ⬜ | GET | `/api/v1/users/me/recent-views` | 최근 본 탭 리스트 (동일 스키마, `bookmarkSaved`는 저장 여부 반영) |
| ⬜ | POST/DELETE | `/api/v1/spaces/{slug}/bookmarks` | 카드 내 스크랩 아이콘 토글 (`schemas/space.ts` `SpaceBookmarkToggleResponseDto`) |

FE 교체 지점:
- `src/data/myScraps.ts` (`MY_SCRAP_SAVED`, `MY_SCRAP_RECENT`) → API 호출로 치환
- `src/pages/MyScrapsPage.tsx` `toggleScrap`는 단일 `savedSet` 기준 — 탭 간 상태 일관성을 보장하려면 서버 토글 응답을 단일 `savedSet`에 반영하는 로직을 유지할 것.

### 2) 포인트 — `/points`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/users/me/points/balance` | `{ balance: number }` |
| ⬜ | GET | `/api/v1/users/me/points/transactions?type=EARN\|SPEND&page=` | `PageDto<PointTransaction>` |

`PointTransaction` 필드: `id, type(EARN\|SPEND), title, dateLabel, amount(양수 지급 / 음수 사용)`.

FE 교체 지점: `src/data/myPoints.ts` (`MY_POINTS_BALANCE`, `MY_POINTS_TRANSACTIONS`).

### 3) 쿠폰 — `/coupons`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/users/me/coupons?status=OWNED\|USED\|EXPIRED` | `UserCouponsResponseDto` (`schemas/coupon.ts`) — FE `MyCoupon` 매핑 필요 |
| ⬜ | POST | `/api/v1/coupons/redeem` | 쿠폰 코드 등록 — 본문 `{ code: string }`, 응답 `{ ownedCouponId, title, ... }` |

FE 교체 지점: `src/data/myCoupons.ts` (`MY_COUPONS`), `CouponsPage.onRegisterSubmit` 내 TODO 주석 참고.

응답 스키마는 기존 `schemas/coupon.ts` `OwnedCouponItemDto`를 따르되, FE의 `MyCoupon`은 할인값(`discountValue: "3,000원"|"10%"`), 조건/기한 라인을 렌더용으로 미리 조합한 형태이므로 백엔드와 presentation 레이어를 분리하고 adapter 함수를 둘 것 (`data/adapters/myCouponsFromApi.ts`).

### 4) 공지사항/이벤트 — `/notices`, `/notices/:slug`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/notices?tab=NOTICE\|EVENT&category=&status=&page=` | 목록. 공지: `category(공지\|업데이트\|정보\|기타)`, 이벤트: `status(진행중\|종료)` + 선택 `dDayLabel` |
| ⬜ | GET | `/api/v1/notices/{slug}` | 상세. `NoticeDetail` (`src/data/notices.ts`) — `blocks: NoticeBlock[]`로 본문을 구조화해 수신할 것 |

`NoticeBlock` 종류: `paragraph` / `heading` / `bullet.items[]` / `winners{title, message?, rows:[{rank, masked}]}`. 서버가 동일 JSON을 내려주면 `DetailBlock` 렌더러를 그대로 재사용 가능.

FE 교체 지점:
- `src/data/notices.ts` — `NOTICE_LIST`, `EVENT_LIST`, `NOTICE_DETAILS`, `getNoticeDetail`
- `getNoticeDetail`은 현재 상세가 누락된 slug에 대해 stub paragraph를 합성하는 fallback이 포함되어 있음. 실 서버 연동 직후에는 404 처리로 전환 필요.

### 5) 고객센터 — `/support`, `/support/inquiry/new`, `/support/inquiry/:id`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/support/faq?category=` | FAQ 목록 |
| ⬜ | GET | `/api/v1/users/me/inquiries?status=` | 1:1 문의 목록 |
| ⬜ | GET | `/api/v1/users/me/inquiries/{id}` | 1:1 문의 상세(질문 + 답변) |
| ⬜ | POST | `/api/v1/inquiries` | 1:1 문의 등록. 본문: `{ category, title, body, imageRefs[] }` |
| ⬜ | §17 | 파일 업로드 | 첨부 이미지 업로드 → `imageRef` 발급 |

FE 교체 지점: `src/data/support.ts` (`FAQ_ITEMS`, `INQUIRY_LIST`, `INQUIRY_DETAILS`, `getInquiryDetail`), `src/pages/InquiryNewPage.tsx` `onSubmit` 내 TODO.

### 6) 이용약관 — `/terms`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/terms?type=LEGAL\|POLICY` | 법적고지/이용정책 현행 본문 |

FE 교체 지점: `src/data/termsContent.ts` (`LEGAL_ARTICLES`, `POLICY_ARTICLES`). 현재 mock 문구는 법무 확정본으로 교체 필요.

### 7) 비즈니스 신청 — `/business/apply`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | POST | `/api/v1/business/applications` | 신청 접수 (회사/사업자/계좌/첨부) |
| ⬜ | GET | `/api/v1/users/me/business/application` | 내 신청 상태 조회 |

FE 교체 지점: `src/pages/BusinessApplyPage.tsx` `onClick` 내 mailto 링크 → 실제 신청 폼으로 라우팅하거나 외부 창 URL로 치환.

### 8) 커뮤니티 — `/community`, `/community/post/:slug`, `/community/write`

대부분의 경로가 이미 `src/api/community.ts`에 구현되어 호출되고 있으나, 목록/필터·미디어 업로드·신고 엔드포인트가 남아있음.

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ⬜ | GET | `/api/v1/posts?category=&sort=&keyword=&page=` | 피드 목록 (`CommunityPage` 카테고리·정렬·검색) |
| ✅ | GET | `/api/v1/posts/{postId}` | 게시글 상세 (`fetchPostDetail`) |
| ✅ | GET | `/api/v1/posts/{postId}/comments` | 댓글 트리 (`fetchPostComments`) |
| ✅ | POST | `/api/v1/posts/{postId}/comments` | 댓글 작성 (`createComment`) |
| ✅ | DELETE | `/api/v1/posts/{postId}/comments/{commentId}` | 댓글 삭제 (`deleteCommentApi`) |
| ✅ | POST | `/api/v1/posts/{postId}/reactions` | 좋아요 토글 (`toggleReaction`) |
| ✅ | POST | `/api/v1/posts` | 게시글 작성 (`createPost`) |
| ✅ | POST | `/api/v1/media/uploads` | 업로드 grant 요청 (`requestPostInlineImageUpload`) → PUT 업로드 후 `mediaRef` 획득 |
| ⬜ | POST | `/api/v1/posts/{postId}/reports` | 게시글 신고 (사유 코드·상세) |
| ⬜ | POST | `/api/v1/posts/{postId}/comments/{commentId}/reports` | 댓글 신고 |

FE 교체 지점:
- 목록: `src/data/communityFeed.ts` (`MOCK_COMMUNITY_FEED`) → API 연동
- 글쓰기: `src/data/communityWrite.ts` (카테고리 옵션) → `GET /api/v1/meta/community-categories` 같은 메타 API로 이관 검토
- 신고: `src/data/communityReportModal.ts`의 사유 목록 → 서버에서 내려주고 FE는 enum만 관리

### 9) 채팅 — `/chat`

`src/api/chat.ts` 에 REST 엔드포인트가 모두 구현되어 있음. 실시간 전송은 gateway의 STOMP/WS 프록시 경로를 사용.

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ✅ | POST | `/api/v1/chat/rooms` | 채팅방 생성 또는 재사용 |
| ✅ | GET | `/api/v1/chat/rooms?type=&page=` | 내 채팅방 목록 |
| ✅ | GET | `/api/v1/chat/rooms/{roomId}` | 채팅방 상세 |
| ✅ | GET | `/api/v1/chat/rooms/unread-count` | 미확인 메시지 수(헤더 뱃지) |
| ✅ | GET | `/api/v1/chat/rooms/{roomId}/messages?cursor=&size=` | 메시지 페이지 |
| ✅ | POST | `/api/v1/chat/rooms/{roomId}/messages` | 메시지 전송 |
| ✅ | POST | `/api/v1/chat/rooms/{roomId}/messages/read` | 읽음 처리 (뷰 진입 시) |
| ⬜ | WS/STOMP | `/ws/chat` (gateway 경유) | 실시간 푸시 — CLAUDE.md의 gateway 라우팅 맵 참고 |

FE 교체 지점: `src/data/chatPage.ts` (`MOCK_CHAT_ROOMS`, `MOCK_MESSAGES`) → API + WS 스트림으로 치환.

### 10) 내 미니피드 — `/my-minifeed`

| 구분 | Method | Path | 용도 |
|:----:|--------|------|------|
| ✅ | GET | `/api/v1/users/me/feed/posts?tab=written\|commented&sort=latest\|popular&page=&size=` | `fetchMyMiniFeed` — 프로필 + 페이지 아이템 |

FE 교체 지점: `src/data/myMiniFeed.ts`는 초기 렌더용 목업만 남겨두고 페이지는 실제 API를 호출 중. 서버 응답의 `profile.tags`·`items[].thumbnailUrl`만 적절히 매핑하면 FE 추가 작업 불필요.

### 11) 신고·취소·쿠폰 다운로드 (모달에서 호출)

여러 페이지에서 모달로 호출되는 소형 엔드포인트. 모달 UI는 이미 FE에 있으며 API만 붙이면 됨.

| 구분 | Method | Path | 용도 | FE 파일 |
|:----:|--------|------|------|--------|
| ⬜ | POST | `/api/v1/bookings/{id}/cancel` | 예약 취소 — 본문 `{ reasonCode, reasonDetail? }` | `src/data/reservationCancelModal.ts` |
| ⬜ | POST | `/api/v1/reviews/{id}/reports` | 리뷰 신고 | `src/data/reviewViewModal.ts` |
| ⬜ | POST | `/api/v1/coupons/{couponId}/claim` | 공간 상세에서 쿠폰 다운로드 (schemas/coupon.ts `CouponClaimResponseDto`) | `src/data/couponDownloadModal.ts`, `src/hooks/useCouponDownloads.ts` |
| ⬜ | GET | `/api/v1/coupons/available?spaceSlug=` | 공간 상세 쿠폰 바텀시트 목록 (`CouponsAvailableResponseDto`) | `src/components/space/CouponDownloadModal.tsx` |

### 12) 정적 메타(FE 내장)

FE에만 존재해도 무방하지만, 향후 서버 메타 API로 이관 가능한 항목:

| FE 파일 | 내용 | 서버 이관 후보 |
|---------|------|---------------|
| `src/data/koreaRegions.ts` | 행정구역 enum | `GET /api/v1/meta/regions` |
| `src/data/profileGenreInstrument.ts` | 장르·악기 선택지 | `GET /api/v1/meta/profile-options` |
| `src/data/banderUsagePolicy.ts` | 밴더 이용정책 모달 본문 | UC-MP §6 이용약관 API의 `type=POLICY`와 통합 |
| `src/data/mapPinAssets.ts` | 지도 핀 SVG 에셋 | FE 리소스로 유지 권장 |

### 공통 권장 사항

- FE에서 현재 `figma.com/api/mcp/asset/...` 형태의 목업 이미지 URL을 다수 사용. 실제 업로드된 미디어로 교체할 때는 `config/media.ts`의 `resolveProfileImageUrl` 패턴처럼 공용 resolver를 거치도록 할 것.
- 모든 목업 데이터 파일은 상단 주석에 "서버 연동 시 대체 대상"과 엔드포인트를 명시. 리팩터 시 grep `서버 연동 시 대체 대상`으로 일괄 탐색 가능.
- 페이지에서 API 호출을 붙일 때는 `src/api/` 하위에 파일을 새로 만들고 `getJson`/`postJson`을 사용. 토큰 주입·에러 래핑은 `client.ts`가 처리.
- 기존 `src/api/*.ts`가 이미 구현된 엔드포인트(위 표의 ✅)는 페이지에서 바로 호출 가능. 남은 ⬜ 항목은 백엔드 스펙 확정 후 클라이언트 파일을 추가·확장하는 순서로 진행.

---

## 문서 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-20 | UC-14에 SSE 실시간 알림 스트림 섹션 추가 — FE 미연동(⬜) 상태와 이벤트 타입·재연결·처리 지침 명시 |
| 2026-04-20 | §1.5 ID 타입 정책 보정 — ID 시맨틱 필드에만 `String` 직렬화 적용, 카운트·금액·좌표 등 수치는 JSON number 유지(전역 Long→String 금지) |
| 2026-04-20 | UC-MP §8~§12 추가: 커뮤니티·채팅·내 미니피드·신고/취소/쿠폰 다운로드·정적 메타 보강, 중복된 공지 섹션 통합 |
| 2026-04-20 | UC-MP 섹션 추가: 스크랩·포인트·쿠폰·공지사항/이벤트·고객센터·이용약관·비즈니스 신청 목업 페이지 연동 가이드 |
| 2026-04-03 | 유즈케이스별 목적·필요성·구체 스키마로 전면 확장 (전달용) |
