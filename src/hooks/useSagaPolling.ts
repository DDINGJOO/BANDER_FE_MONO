import { useEffect, useRef, useState } from 'react';
import { getSagaStatus, SagaStatus, SagaStatusResponse } from '../api/bookings';

export type UseSagaPollingOptions = {
  /** Polling interval in ms. Default 2000. */
  intervalMs?: number;
  /** Hard timeout in ms. Default 15 minutes (matches Payment expires_at). */
  maxDurationMs?: number;
  /** Pause polling when document is hidden. Default true. */
  pauseOnHidden?: boolean;
};

export type UseSagaPollingState = {
  status: SagaStatus | null;
  data: SagaStatusResponse | null;
  error: string | null;
  /** True once status is COMPLETED, FAILED, or polling timed out. */
  done: boolean;
  timedOut: boolean;
};

const TERMINAL: ReadonlySet<SagaStatus> = new Set<SagaStatus>(['COMPLETED', 'FAILED']);

/**
 * Polls /api/v1/orchestrator/sagas/{sagaId} every `intervalMs` until the saga reaches a
 * terminal state (COMPLETED, FAILED) or the timeout expires.
 *
 * Pauses on document.visibilityState === 'hidden' to avoid background traffic.
 * Aborts in-flight requests on unmount.
 *
 * @param sagaId The saga id returned by createBooking() when kind === 'saga'. Pass null/undefined to disable.
 */
export function useSagaPolling(
  sagaId: string | null | undefined,
  options?: UseSagaPollingOptions,
): UseSagaPollingState {
  const intervalMs = options?.intervalMs ?? 2000;
  const maxDurationMs = options?.maxDurationMs ?? 15 * 60 * 1000;
  const pauseOnHidden = options?.pauseOnHidden ?? true;

  const [data, setData] = useState<SagaStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const stoppedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    if (!sagaId) return undefined;

    stoppedRef.current = false;
    startedAtRef.current = Date.now();
    const controller = new AbortController();

    const stop = () => {
      stoppedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const tick = async () => {
      if (stoppedRef.current) return;
      if (Date.now() - startedAtRef.current >= maxDurationMs) {
        setTimedOut(true);
        setDone(true);
        stop();
        return;
      }
      if (pauseOnHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        timerRef.current = setTimeout(tick, intervalMs);
        return;
      }

      try {
        const result = await getSagaStatus(sagaId, { signal: controller.signal });
        if (stoppedRef.current) return;
        setData(result);
        if (TERMINAL.has(result.status)) {
          setDone(true);
          stop();
          return;
        }
      } catch (e) {
        if (stoppedRef.current) return;
        // transient errors (network blip, gateway 5xx) — keep polling until timeout
        setError(e instanceof Error ? e.message : '상태 확인 중 오류가 발생했습니다.');
      }

      if (!stoppedRef.current) {
        timerRef.current = setTimeout(tick, intervalMs);
      }
    };

    void tick();

    return () => {
      stop();
      controller.abort();
    };
  }, [sagaId, intervalMs, maxDurationMs, pauseOnHidden]);

  return {
    status: data?.status ?? null,
    data,
    error,
    done,
    timedOut,
  };
}
