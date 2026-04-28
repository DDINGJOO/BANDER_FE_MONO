import { ApiError } from './client';
import { getApiBaseUrl } from '../config/publicEnv';
import { clearAuthSession } from '../data/authSession';

/**
 * Client-side image diet: 폰 카메라 원본(수십 MB / 4000+px) 을 PUT 직전에
 * 긴 변 1600px cap 으로 리사이즈한다. 더 작거나, GIF/SVG/HEIC/non-image,
 * 디코딩 실패, 리사이즈 결과가 더 큰 경우엔 원본 File 그대로 반환.
 *
 * 캔버스 화질은 libvips 대비 평이하지만, "업로드 직전 다이어트" 목적엔
 * 충분하다. 향후 media-worker 가 libvips 로 webp/avif 를 만들고
 * `MediaOptimized` 이벤트로 swap 하면 결과물은 더 깨끗해진다.
 */
async function resizeImageIfLarge(file: File): Promise<File> {
  const MAX_LONG_EDGE = 1600;
  const QUALITY = 0.85;

  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/heic' ||
    file.type === 'image/heif'
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width <= MAX_LONG_EDGE && bitmap.height <= MAX_LONG_EDGE) {
        return file;
      }
      const ratio = MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height);
      const targetW = Math.round(bitmap.width * ratio);
      const targetH = Math.round(bitmap.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, outputType, outputType === 'image/jpeg' ? QUALITY : undefined),
      );
      if (!blob) return file;
      if (blob.size >= file.size) return file;

      const ext = outputType === 'image/jpeg' ? '.jpg' : '.png';
      const newName = file.name.replace(/\.[^.]+$/, ext);
      return new File([blob], newName, { type: outputType, lastModified: Date.now() });
    } finally {
      bitmap.close?.();
    }
  } catch {
    return file;
  }
}

export const __TEST_ONLY__resizeImageIfLarge = resizeImageIfLarge;

/**
 * SHA-256 base64 digest of a File (browser-side, via Web Crypto).
 *
 * Kept as an exported helper for callers that explicitly want to send a
 * client-side checksum to the backend. NOTE: as of the
 * `fix/browser-presign-headers-regression` change, `putAndCommit` does NOT
 * call this anymore — the AWS SDK 2.x chunked checksum trailers
 * (`x-amz-sdk-checksum-algorithm` / `x-amz-checksum-sha256`) are
 * incompatible with browser `fetch` and break SigV4 because the presigned
 * URL is generated WITHOUT those headers in the signed set. See
 * `services/media/media-service/.../AwsS3MediaStorageAdapter.java` for the
 * design rationale.
 */
export async function sha256Base64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * SHA-256 hex digest. Kept for callers that explicitly want hex (rare).
 * Backend (PR-AC) accepts both hex and base64 forms.
 */
export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return (
    'sha256:' +
    Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

export type MediaCommitRequest = {
  contentLength: number;
  /**
   * Optional client-side checksum. When omitted, the backend's
   * `CommitService.verifyChecksum` falls back to size-only verification.
   * `putAndCommit` deliberately omits it because the browser cannot send
   * AWS chunked checksum trailers without breaking the SigV4 signature.
   */
  clientChecksum?: string;
  originalFilename: string;
};

export type MediaCommitMetadata = {
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sizeBytes?: number | null;
};

export type MediaCommitResponse = {
  ok: boolean;
  metadata?: MediaCommitMetadata;
};

/**
 * Calls POST /api/v1/media/{mediaId}/commit. Backend HEAD-checks S3 + verifies checksum.
 * Idempotent on already-COMMITTED state. On 422 the ticket is moved to REJECTED_BY_CLIENT
 * terminal so SQS auto-commit will not overwrite the explicit refusal.
 *
 * NOTE: `MediaCommitController` returns the raw envelope `{ok, metadata}`,
 * NOT the shared `{success, data}` envelope used by `requestJson`/`postJson`.
 * Calling `postJson` here would 200-but-throw because `payload.success` is
 * undefined. We therefore issue a raw `fetch` and parse the body manually.
 */
export async function commitMedia(
  mediaId: string,
  body: MediaCommitRequest,
): Promise<MediaCommitResponse> {
  let response: Response;
  try {
    response = await fetch(
      `${getApiBaseUrl()}/api/v1/media/${encodeURIComponent(mediaId)}/commit`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
  } catch (error) {
    throw new ApiError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 0);
  }

  if (response.status === 401) {
    clearAuthSession();
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorPayload = (payload ?? {}) as {
      error?: { code?: string; message?: string };
    };
    throw new ApiError(
      errorPayload.error?.message ?? '요청 처리에 실패했습니다.',
      response.status,
      errorPayload.error?.code,
    );
  }

  const okPayload = (payload ?? {}) as MediaCommitResponse;
  if (okPayload.ok !== true) {
    throw new ApiError('미디어 커밋에 실패했습니다.', response.status);
  }
  return okPayload;
}

/**
 * Upload + commit in one shot.
 * Caller already has an upload grant (mediaRef/uploadUrl/ownershipTicket).
 *
 * Performs:
 *   1. PUT the file body to the presigned S3 URL with ONLY the headers the
 *      backend signed (Content-Type when present). We deliberately do NOT
 *      send `x-amz-sdk-checksum-algorithm` / `x-amz-checksum-sha256` because
 *      the presigned URL is generated WITHOUT those headers in the signed
 *      set — AWS SDK 2.x chunked checksum trailers are incompatible with
 *      browser `fetch`, so the backend's `AwsS3MediaStorageAdapter` strips
 *      them on purpose. Sending them anyway flips the SigV4 canonical
 *      header set and S3 returns 403.
 *   2. POST /commit so the backend HEAD-checks the object in S3 and confirms
 *      the ticket state → COMMITTED. Because we no longer send a
 *      `clientChecksum`, the backend's `CommitService.verifyChecksum` takes
 *      the size-only verification path (logs `commit_checksum_skipped`),
 *      which is the documented fallback for browser uploads.
 *
 * Returns `{ mediaId, ownershipTicket }` ready to thread into apply request bodies.
 */
export async function putAndCommit(input: {
  mediaId: string;
  uploadUrl: string;
  uploadHeaders?: Record<string, string>;
  ownershipTicket?: string;
  file: File;
}): Promise<{ mediaId: string; ownershipTicket: string }> {
  const fileToUpload = await resizeImageIfLarge(input.file);

  const headers = new Headers(input.uploadHeaders ?? {});
  if (!headers.has('Content-Type') && fileToUpload.type) {
    headers.set('Content-Type', fileToUpload.type);
  }

  const uploadResp = await fetch(input.uploadUrl, {
    method: 'PUT',
    headers,
    body: fileToUpload,
  });
  if (!uploadResp.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  await commitMedia(input.mediaId, {
    contentLength: fileToUpload.size,
    originalFilename: fileToUpload.name,
  });

  // ownershipTicket may be empty for legacy/anonymous grants — caller decides if that's
  // acceptable for the apply target.
  return {
    mediaId: input.mediaId,
    ownershipTicket: input.ownershipTicket ?? '',
  };
}
