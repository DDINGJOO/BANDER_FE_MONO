import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { GUEST_GATE_EVENT, type GuestGateEventDetail } from '../../lib/guestGate';
import { GuestGateModal } from './GuestGateModal';

type GuestGateContextValue = {
  closeGuestGate: () => void;
  openGuestGate: (returnTo?: string) => void;
};

const GuestGateContext = createContext<GuestGateContextValue>({
  closeGuestGate: () => {},
  openGuestGate: () => {},
});

function normalizeReturnTo(returnTo?: string) {
  if (returnTo?.trim()) {
    return returnTo;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function GuestGateProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | undefined>();

  const openGuestGate = useCallback((nextReturnTo?: string) => {
    setReturnTo(normalizeReturnTo(nextReturnTo));
    setOpen(true);
  }, []);

  const closeGuestGate = useCallback(() => {
    setOpen(false);
  }, []);

  const proceedToLogin = useCallback(() => {
    setOpen(false);
    navigate(returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login');
  }, [navigate, returnTo]);

  useEffect(() => {
    const onGuestGate = (event: Event) => {
      const detail = (event as CustomEvent<GuestGateEventDetail>).detail;
      openGuestGate(detail?.returnTo);
    };

    window.addEventListener(GUEST_GATE_EVENT, onGuestGate);
    return () => {
      window.removeEventListener(GUEST_GATE_EVENT, onGuestGate);
    };
  }, [openGuestGate]);

  const value = useMemo(
    () => ({
      closeGuestGate,
      openGuestGate,
    }),
    [closeGuestGate, openGuestGate]
  );

  return (
    <GuestGateContext.Provider value={value}>
      {children}
      <GuestGateModal onClose={closeGuestGate} onProceed={proceedToLogin} open={open} />
    </GuestGateContext.Provider>
  );
}

export function useGuestGate() {
  return useContext(GuestGateContext);
}
