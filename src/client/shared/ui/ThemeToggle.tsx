// ============================================================
// ThemeToggle — BL-036: Dark/Light/Auto theme toggle
// ============================================================

import { Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

const themeIcons: Record<Theme, typeof Sun> = {
  dark: Moon,
  light: Sun,
  auto: Monitor,
};

const themeLabels: Record<Theme, string> = {
  dark: 'Тёмная тема',
  light: 'Светлая тема',
  auto: 'Авто (системная)',
};

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const Icon = themeIcons[theme];

  return (
    <button
      onClick={onToggle}
      title={themeLabels[theme]}
      className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
