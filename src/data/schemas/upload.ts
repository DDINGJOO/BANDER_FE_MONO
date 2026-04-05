/**
 * UC-18 파일 업로드
 * @see docs/BACKEND_API.md §17
 */

/** POST /api/v1/uploads/profile/presign */
export type ProfilePresignResponseDto = {
  uploadUrl: string;
  imageRef: string;
  headers?: Record<string, string>;
};

/** POST /api/v1/uploads/profile (multipart 대안) */
export type ProfileUploadSimpleResponseDto = {
  imageRef: string;
};
