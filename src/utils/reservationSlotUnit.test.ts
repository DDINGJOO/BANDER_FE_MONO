import {
  formatReservationUnitNote,
  getReservationSlotMinutes,
  parseReservationUnitMinutes,
} from './reservationSlotUnit';

describe('reservationSlotUnit', () => {
  test('parses backend and display slot units', () => {
    expect(parseReservationUnitMinutes('ONE_HOUR')).toBe(60);
    expect(parseReservationUnitMinutes('THIRTY_MINUTES')).toBe(30);
    expect(parseReservationUnitMinutes('60분')).toBe(60);
    expect(parseReservationUnitMinutes('/30분')).toBe(30);
    expect(parseReservationUnitMinutes('1시간')).toBe(60);
  });

  test('uses the first valid unit and formats the selection note', () => {
    const minutes = getReservationSlotMinutes('', null, '/60분');

    expect(minutes).toBe(60);
    expect(formatReservationUnitNote(minutes)).toBe('최소 1시간 단위로 선택');
  });
});
