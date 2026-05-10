// ============================================================
// ToastContainer — рендерит все активные уведомления
// ============================================================

import { useToast } from '../hooks/useToast';
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

const PROGRESS_COLORS = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const Icon = ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-lg border backdrop-blur-sm shadow-lg animate-[fadeIn_0.2s_ease-out] ${COLORS[toast.type]}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
            {toast.duration && toast.duration > 0 && (
              <div className="absolute bottom-0 left-0 h-0.5 rounded-b-lg overflow-hidden w-full">
                <div
                  className={`h-full ${PROGRESS_COLORS[toast.type]} animate-[shrink_linear_forwards]`}
                  style={{ animationDuration: `${toast.duration}ms` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
