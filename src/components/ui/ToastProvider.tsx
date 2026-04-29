import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'error' | 'info' | 'success';

type ToastInput = {
  durationMs?: number;
  message: string;
  type?: ToastType;
};

type ToastItem = Required<Pick<ToastInput, 'message' | 'type'>> & {
  id: string;
};

type ToastContextValue = {
  showToast: (input: string | ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: string | ToastInput) => {
    const normalized = typeof input === 'string'
      ? { message: input, type: 'info' as ToastType }
      : { message: input.message, type: input.type ?? 'info' };
    const message = normalized.message.trim();
    if (!message) {
      return;
    }

    const id = createToastId();
    setToasts((prev) => [...prev.slice(-2), { id, message, type: normalized.type }]);
    window.setTimeout(() => removeToast(id), typeof input === 'string' ? 3600 : input.durationMs ?? 3600);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="app-toast-region" aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => (
          <div
            className={`app-toast app-toast--${toast.type}`}
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
          >
            <span className="app-toast__dot" aria-hidden="true" />
            <p className="app-toast__message">{toast.message}</p>
            <button
              aria-label="알림 닫기"
              className="app-toast__close"
              onClick={() => removeToast(toast.id)}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) ?? { showToast: () => undefined };
}
