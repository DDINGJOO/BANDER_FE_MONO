import { postJson } from './client';

/**
 * SHA-256 base64 digest of a File (browser-side, via Web Crypto).
 * Used for AWS S3 native checksum verification (`x-amz-checksum-sha256` header).
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
  clientChecksum: string;
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
 */
export function commitMedia(mediaId: string, body: MediaCommitRequest) {
  return postJson<MediaCommitResponse>(
    `/api/v1/media/${encodeURIComponent(mediaId)}/commit`,
    body,
  );
}

/**
 * Upload + commit in one shot.
 * Caller already has an upload grant (mediaRef/uploadUrl/ownershipTicket).
 * Performs:
 *   1. SHA-256 of the file (base64, AWS S3 native form)
 *   2. PUT to S3 with x-amz-sdk-checksum-algorithm + x-amz-checksum-sha256 headers
 *      (S3 verifies the body matches the checksum at upload time)
 *   3. POST /commit so backend reads ChecksumSHA256 from S3 HEAD and confirms
 *      ticket state → COMMITTED
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
  // Compute SHA-256 first so we can sign the PUT with x-amz-checksum-sha256.
  const checksumBase64 = await sha256Base64(input.file);

  const headers = new Headers(input.uploadHeaders ?? {});
  if (!headers.has('Content-Type') && input.file.type) {
    headers.set('Content-Type', input.file.type);
  }
  // AWS S3 native checksum verification — backend's presigned URL signs these
  // headers (PR-AC). S3 will reject the PUT if the body's SHA-256 differs.
  if (!headers.has('x-amz-sdk-checksum-algorithm')) {
    headers.set('x-amz-sdk-checksum-algorithm', 'SHA256');
  }
  if (!headers.has('x-amz-checksum-sha256')) {
    headers.set('x-amz-checksum-sha256', checksumBase64);
  }

  const uploadResp = await fetch(input.uploadUrl, {
    method: 'PUT',
    headers,
    body: input.file,
  });

  if (!uploadResp.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  await commitMedia(input.mediaId, {
    contentLength: input.file.size,
    // Send the same base64 form to the backend so it can short-circuit the
    // S3-side compare without re-fetching the object.
    clientChecksum: checksumBase64,
    originalFilename: input.file.name,
  });

  // ownershipTicket may be empty for legacy/anonymous grants — caller decides if that's
  // acceptable for the apply target.
  return {
    mediaId: input.mediaId,
    ownershipTicket: input.ownershipTicket ?? '',
  };
}
