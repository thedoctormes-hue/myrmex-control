interface Props {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 flex items-center justify-between gap-3 animate-in fade-in">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex-shrink-0">⚠️</span>
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-destructive/70 hover:text-destructive flex-shrink-0"
        aria-label="Закрыть"
      >
        ✕
      </button>
    </div>
  );
}
