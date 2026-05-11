import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

// ============================================================
// Notifications — toast-уведомления с автоскрытием
// ============================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  add: (type: NotificationType, message: string, duration?: number) => void;
  remove: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  add: () => {},
  remove: () => {},
});

export function useNotifications() {
  return useContext(NotificationContext);
}

// Global helper — можно вызывать из любого места
let globalAdd: ((type: NotificationType, message: string, duration?: number) => void) | null = null;

export function notify(type: NotificationType, message: string, duration?: number) {
  globalAdd?.(type, message, duration);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = useCallback((type: NotificationType, message: string, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setNotifications(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    globalAdd = add;
    return () => { globalAdd = null; };
  }, [add]);

  return (
    <NotificationContext.Provider value={{ notifications, add, remove }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={remove} />
    </NotificationContext.Provider>
  );
}

const ICONS: Record<NotificationType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<NotificationType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-400' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
};

function NotificationContainer({ notifications, onRemove }: { notifications: Notification[]; onRemove: (id: string) => void }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {notifications.map(n => (
        <NotificationToast key={n.id} notification={n} onRemove={onRemove} />
      ))}
    </div>
  );
}

function NotificationToast({ notification, onRemove }: { notification: Notification; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const { id, type, message, duration = 4000 } = notification;
  const Icon = ICONS[type];
  const colors = COLORS[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <div
      className={`animate-toast-in ${colors.bg} ${colors.border} border rounded-lg p-3 flex items-start gap-2 shadow-lg ${
        exiting ? 'animate-toast-out' : ''
      }`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.icon}`} />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onRemove(id), 300); }}
        className="text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
