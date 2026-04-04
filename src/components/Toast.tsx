import { useState, useCallback, createContext, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Toast Types ───────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ── Toast Icon ────────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error:   <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info size={18} />,
};

const STYLES: Record<ToastType, { wrap: string; icon: string; bar: string }> = {
  success: {
    wrap: 'bg-white border-l-4 border-emerald-500 shadow-lg',
    icon: 'text-emerald-500 bg-emerald-50',
    bar:  'bg-emerald-500',
  },
  error: {
    wrap: 'bg-white border-l-4 border-rose-500 shadow-lg',
    icon: 'text-rose-500 bg-rose-50',
    bar:  'bg-rose-500',
  },
  warning: {
    wrap: 'bg-white border-l-4 border-amber-500 shadow-lg',
    icon: 'text-amber-500 bg-amber-50',
    bar:  'bg-amber-500',
  },
  info: {
    wrap: 'bg-white border-l-4 border-blue-500 shadow-lg',
    icon: 'text-blue-500 bg-blue-50',
    bar:  'bg-blue-500',
  },
};

// ── Individual Toast ──────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const st = STYLES[toast.type];
  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-xl px-4 py-3.5 min-w-[300px] max-w-sm',
        'animate-in slide-in-from-right-6 duration-300',
        st.wrap
      )}
    >
      {/* Icon */}
      <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', st.icon)}>
        {ICONS[toast.type]}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-sm leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{toast.message}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

const CONFIRM_VARIANTS = {
  danger: {
    icon: <XCircle size={28} />,
    iconWrap: 'bg-rose-100 text-rose-600',
    confirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  },
  warning: {
    icon: <AlertCircle size={28} />,
    iconWrap: 'bg-amber-100 text-amber-600',
    confirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm',
  },
  primary: {
    icon: <Info size={28} />,
    iconWrap: 'bg-blue-100 text-blue-600',
    confirm: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  },
};

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onResult: (result: boolean) => void;
}

function ConfirmDialog({ options, onResult }: ConfirmDialogProps) {
  const v = CONFIRM_VARIANTS[options.variant ?? 'primary'];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Top accent bar */}
        <div className={cn('h-1', options.variant === 'danger' ? 'bg-rose-500' : options.variant === 'warning' ? 'bg-amber-500' : 'bg-blue-500')} />

        <div className="p-6 text-center">
          {/* Icon */}
          <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4', v.iconWrap)}>
            {v.icon}
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-slate-900 mb-2">{options.title}</h3>

          {/* Message */}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">{options.message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onResult(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm"
            >
              {options.cancelText ?? 'Cancel'}
            </button>
            <button
              onClick={() => onResult(true)}
              className={cn('flex-[1.4] py-2.5 px-4 rounded-xl font-bold transition-all text-sm', v.confirm)}
            >
              {options.confirmText ?? 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timerRef.current[id]);
    delete timerRef.current[id];
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      timerRef.current[id] = setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirmResult = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-5 right-5 z-[150] flex flex-col gap-2.5">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <ConfirmDialog options={confirmState.options} onResult={handleConfirmResult} />
      )}
    </ToastContext.Provider>
  );
}
