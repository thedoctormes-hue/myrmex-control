import { useState, useCallback, createContext, useContext } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// ============================================================
// ConfirmDialog — замена нативного confirm() на красивый диалог
// ============================================================

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

// Global helper
let globalConfirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null;

export async function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return globalConfirm?.(options) ?? false;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setDialog({ ...options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    dialog?.resolve(true);
    setDialog(null);
  }, [dialog]);

  const handleCancel = useCallback(() => {
    dialog?.resolve(false);
    setDialog(null);
  }, [dialog]);

  // Register global
  useState(() => { globalConfirm = confirm; });

  const variantColors = {
    danger: { bg: 'bg-red-500/10', border: 'border-red-500/30', button: 'bg-red-500 hover:bg-red-600', icon: 'text-red-400' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', button: 'bg-amber-500 hover:bg-amber-600', icon: 'text-amber-400' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', button: 'bg-blue-500 hover:bg-blue-600', icon: 'text-blue-400' },
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />
          <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-4 border-b border-border ${variantColors[dialog.variant || 'danger'].bg}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${variantColors[dialog.variant || 'danger'].icon}`} />
                <h3 className="font-semibold">{dialog.title}</h3>
                <button onClick={handleCancel} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground">{dialog.message}</p>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors"
              >
                {dialog.cancelLabel || 'Отмена'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${variantColors[dialog.variant || 'danger'].button}`}
              >
                {dialog.confirmLabel || 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
