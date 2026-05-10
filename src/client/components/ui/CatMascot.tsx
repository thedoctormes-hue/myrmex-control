// ============================================================
// CatMascot — SVG маскот кота ЗавЛаб для пустых состояний
// ============================================================

interface Props {
  className?: string;
  size?: number;
}

export function CatMascot({ className = '', size = 80 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ЗавЛаб cat mascot"
      role="img"
    >
      {/* Body */}
      <ellipse cx="60" cy="78" rx="32" ry="28" fill="#1e2433" />
      {/* Head */}
      <circle cx="60" cy="48" r="26" fill="#1e2433" />
      {/* Left ear */}
      <polygon points="38,30 30,6 48,24" fill="#1e2433" />
      <polygon points="40,28 34,12 46,24" fill="#f59e0b" opacity="0.3" />
      {/* Right ear */}
      <polygon points="82,30 90,6 72,24" fill="#1e2433" />
      <polygon points="80,28 86,12 74,24" fill="#f59e0b" opacity="0.3" />
      {/* Eyes */}
      <ellipse cx="49" cy="46" rx="5" ry="6" fill="#f59e0b" className="animate-breathing" />
      <ellipse cx="71" cy="46" rx="5" ry="6" fill="#f59e0b" className="animate-breathing" />
      {/* Eye pupils */}
      <ellipse cx="50" cy="47" rx="2" ry="3" fill="#0a0e1a" />
      <ellipse cx="72" cy="47" rx="2" ry="3" fill="#0a0e1a" />
      {/* Eye shine */}
      <circle cx="51" cy="44" r="1.2" fill="white" opacity="0.8" />
      <circle cx="73" cy="44" r="1.2" fill="white" opacity="0.8" />
      {/* Nose */}
      <polygon points="60,54 56,50 64,50" fill="#f59e0b" opacity="0.7" />
      {/* Mouth */}
      <path d="M56,57 Q60,61 64,57" stroke="#f59e0b" strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* Whiskers */}
      <line x1="36" y1="52" x2="48" y2="54" stroke="#f59e0b" strokeWidth="0.8" opacity="0.4" />
      <line x1="36" y1="56" x2="48" y2="56" stroke="#f59e0b" strokeWidth="0.8" opacity="0.4" />
      <line x1="72" y1="54" x2="84" y2="52" stroke="#f59e0b" strokeWidth="0.8" opacity="0.4" />
      <line x1="72" y1="56" x2="84" y2="56" stroke="#f59e0b" strokeWidth="0.8" opacity="0.4" />
      {/* Tail */}
      <path d="M90,85 Q105,70 98,55" stroke="#1e2433" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Paws */}
      <ellipse cx="48" cy="104" rx="8" ry="5" fill="#1e2433" />
      <ellipse cx="72" cy="104" rx="8" ry="5" fill="#1e2433" />
      {/* Paw details */}
      <circle cx="45" cy="103" r="1.5" fill="#f59e0b" opacity="0.2" />
      <circle cx="48" cy="102" r="1.5" fill="#f59e0b" opacity="0.2" />
      <circle cx="51" cy="103" r="1.5" fill="#f59e0b" opacity="0.2" />
      <circle cx="69" cy="103" r="1.5" fill="#f59e0b" opacity="0.2" />
      <circle cx="72" cy="102" r="1.5" fill="#f59e0b" opacity="0.2" />
      <circle cx="75" cy="103" r="1.5" fill="#f59e0b" opacity="0.2" />
    </svg>
  );
}
