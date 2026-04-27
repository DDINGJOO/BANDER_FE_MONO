import { postJson } from './client';

/**
 * SHA-256 hex digest of a File (browser-side, via Web Crypto).
 * Returns the canonical "sha256:<hex>" form expected by the backend commit API.
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
 *   1. PUT to S3 (presigned URL)
 *   2. SHA-256 of the file (browser)
 *   3. POST /commit to lock ticket state to COMMITTED
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
  const headers = new Headers(input.uploadHeaders ?? {});
  if (!headers.has('Content-Type') && input.file.type) {
    headers.set('Content-Type', input.file.type);
  }

  const uploadResp = await fetch(input.uploadUrl, {
    method: 'PUT',
    headers,
    body: input.file,
  });

  if (!uploadResp.ok) {
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  const checksum = await sha256Hex(input.file);
  await commitMedia(input.mediaId, {
    contentLength: input.file.size,
    clientChecksum: checksum,
    originalFilename: input.file.name,
  });

  // ownershipTicket may be empty for legacy/anonymous grants — caller decides if that's
  // acceptable for the apply target.
  return {
    mediaId: input.mediaId,
    ownershipTicket: input.ownershipTicket ?? '',
  };
}
