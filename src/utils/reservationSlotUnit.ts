export const DEFAULT_RESERVATION_SLOT_MINUTES = 30;

export function parseReservationUnitMinutes(value: string | null | undefined): number | null {
  const normalized = (value ?? '').trim();
  if (!normalized) {
    return null;
  }

  const upper = normalized.toUpperCase().replace(/\s+/g, '_');
  if (upper === 'ONE_HOUR' || upper === '60MIN') {
    return 60;
  }
  if (upper === 'THIRTY_MINUTES' || upper === '30MIN') {
    return 30;
  }

  const numericMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!numericMatch) {
    return null;
  }

  const amount = Number(numericMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (normalized.includes('시간')) {
    return Math.round(amount * 60);
  }

  return Math.round(amount);
}

export function getReservationSlotMinutes(...candidates: Array<string | null | undefined>): number {
  for (const candidate of candidates) {
    const minutes = parseReservationUnitMinutes(candidate);
    if (minutes && minutes > 0) {
      return minutes;
    }
  }

  return DEFAULT_RESERVATION_SLOT_MINUTES;
}

export function formatReservationUnitLabel(minutes: number): string {
  if (minutes > 0 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? '1시간' : `${hours}시간`;
  }

  return `${minutes}분`;
}

export function formatReservationUnitNote(minutes: number): string {
  return `최소 ${formatReservationUnitLabel(minutes)} 단위로 선택`;
}
