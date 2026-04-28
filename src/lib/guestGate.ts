export const GUEST_GATE_EVENT = 'bander:guest-gate';

export type GuestGateEventDetail = {
  returnTo?: string;
};

export function requestGuestGate(returnTo?: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<GuestGateEventDetail>(GUEST_GATE_EVENT, {
      detail: { returnTo },
    })
  );
}
