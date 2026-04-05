/** Figma 6163:38225 이용전 · 6419:79193 이용후 · 6419:79488 취소 */

import { reservationDetailHref } from './reservationDetail';
import type {
  MyReservationActionDto,
  MyReservationDetailRowDto,
  MyReservationListItemDto,
  MyReservationStatusDto,
  MyReservationTabDto,
} from './schemas/reservations';

export type MyReservationTab = MyReservationTabDto;
export type MyReservationStatus = MyReservationStatusDto;
export type MyReservationAction = MyReservationActionDto;
export type MyReservationDetailRow = MyReservationDetailRowDto;

/** GET /api/v1/users/me/reservations 한 행과 동일 계약 */
export type MyReservation = MyReservationListItemDto;

export const MY_RESERVATIONS: MyReservation[] = [
  {
    id: 'r1',
    tab: 'upcoming',
    status: 'confirmed',
    reservationNo: '예약번호 20250109ATEC123',
    headlineRight: '15일 15시간 44분 뒤 입실 가능',
    headlineAccent: 'primary',
    spaceTitle: 'A룸 그랜드 피아노 대관',
    vendorName: '유스뮤직',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/faf24acb-5b97-4dc9-b496-b8cfd2bf7e18',
    dateTimeLine: '25.08.13 (수) 16:00 ~ 17:00 ',
    durationLine: '총 1시간 이용',
    detailPath: reservationDetailHref('confirmed'),
    action: 'cancel',
  },
  {
    id: 'r2',
    tab: 'upcoming',
    status: 'pending',
    reservationNo: '예약번호 20250109ATEC123',
    headlineRight: '판매자가 아직 예약을 확정하지 않았어요',
    headlineAccent: 'muted',
    spaceTitle: '2번방 기타, 디지털 피아노',
    vendorName: '사운드시티',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/af67d13c-fbe7-4493-b2d3-4eb610f26c41',
    dateTimeLine: '25.08.15 (금) 15:00 ~ 18:00 ',
    durationLine: '총 3시간 이용',
    detailPath: reservationDetailHref('pending'),
    action: 'cancel',
  },
  {
    id: 'r3',
    tab: 'upcoming',
    status: 'confirmed',
    reservationNo: '예약번호 20250109ATEC123',
    headlineRight: '15시간 44분 뒤 입실 가능',
    headlineAccent: 'primary',
    spaceTitle: '7번방 마이크, 디지털 피아노',
    vendorName: '사운드시티',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/c1c89983-892a-473c-893f-8018ed149c33',
    dateTimeLine: '25.08.01 (목) 12:00 ~ 14:00 ',
    durationLine: '총 2시간 이용',
    detailPath: reservationDetailHref('confirmed'),
    action: 'cancel',
  },
  {
    id: 'p1',
    tab: 'past',
    status: 'completed',
    reservationNo: '예약번호 20250109ATEC123',
    spaceTitle: 'A룸 그랜드 피아노 대관',
    vendorName: '유스뮤직',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/faf24acb-5b97-4dc9-b496-b8cfd2bf7e18',
    dateTimeLine: '25.08.13 (수) 16:00 ~ 17:00 ',
    durationLine: '총 1시간 이용',
    detailPath: reservationDetailHref('completed'),
    action: 'writeReview',
  },
  {
    id: 'p2',
    tab: 'past',
    status: 'completed',
    reservationNo: '예약번호 20250109ATEC123',
    headlineRight: '15시간 44분 뒤 입실 가능',
    headlineAccent: 'primary',
    spaceTitle: '7번방 마이크, 디지털 피아노',
    vendorName: '사운드시티',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/1d481661-d97e-4e61-b94d-22a98c5007b4',
    dateTimeLine: '25.08.01 (목) 12:00 ~ 14:00 ',
    durationLine: '총 2시간 이용',
    detailPath: reservationDetailHref('completed'),
    action: 'viewMyReview',
  },
  {
    id: 'c1',
    tab: 'canceled',
    status: 'canceledUser',
    reservationNo: '예약번호 20250109ATEC123',
    spaceTitle: 'A룸 그랜드 피아노 대관',
    vendorName: '유스뮤직',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/c68c4f1d-f446-404a-96a2-a9b9a8c21c4a',
    detailRows: [
      { label: '일자/시간', value: '25.08.12 (화) 12:00' },
      { label: '일자/시간', value: '25.08.13 (수) 16:00 ~ 17:00 ' },
      { label: '예약시간', value: '총 3시간 이용' },
    ],
    detailPath: '/spaces/a-room-grand-piano-rental',
    action: 'none',
  },
  {
    id: 'c2',
    tab: 'canceled',
    status: 'canceledVendor',
    reservationNo: '예약번호 20250109ATEC123',
    spaceTitle: '7번방 마이크, 디지털 피아노',
    vendorName: '사운드시티',
    thumbUrl:
      'https://www.figma.com/api/mcp/asset/d97a6751-691d-45ad-8d36-0eade39990f5',
    detailRows: [
      { label: '취소일', value: '25.08.12 (화) 12:00' },
      { label: '일자/시간', value: '25.08.15 (금) 15:00 ~ 18:00 ' },
      { label: '예약시간', value: '총 3시간 이용' },
    ],
    detailPath: '/spaces/yamaha-u3-room',
    action: 'none',
  },
];

export function reservationsForTab(tab: MyReservationTab): MyReservation[] {
  return MY_RESERVATIONS.filter((r) => r.tab === tab);
}
