import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { t } from '../lib/i18n';

// ============================================================
// Breadcrumbs — навигационные крошки
// ============================================================

const ROUTE_LABELS: Record<string, string> = {
  '/': 'nav.dashboard',
  '/projects': 'nav.projects',
  '/agents': 'nav.agents',
  '/library': 'nav.library',
  '/files': 'nav.files',
  '/servers': 'nav.servers',
  '/graph': 'nav.graph',
  '/analytics': 'nav.analytics',
  '/audit': 'nav.audit',
  '/settings': 'nav.settings',
};

const BOARD_LABELS: Record<string, string> = {
  cat: '🐱 Кот',
  ant: '🐜 Муравей',
  zavlab: '🏭 ЗавЛаб',
};

interface Props {
  state?: { projects?: { id: string; name: string }[] } | null;
}

export function Breadcrumbs({ state }: Props) {
  const location = useLocation();
  const path = location.pathname;

  const crumbs = useMemo(() => {
    const parts = path.split('/').filter(Boolean);
    const result: { label: string; to: string }[] = [];

    // Home
    result.push({ label: t('nav.dashboard'), to: '/' });

    if (parts.length === 0) return result;

    // Build path segments
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      currentPath += `/${parts[i]}`;
      const segment = parts[i];

      // Check for board routes
      if (parts[0] === 'board' && i === 1) {
        result.push({ label: 'Доска', to: '/projects' });
        result.push({ label: BOARD_LABELS[segment] || segment, to: currentPath });
        continue;
      }

      // Check for project routes
      if (parts[0] === 'project' && i === 1) {
        result.push({ label: t('nav.projects'), to: '/projects' });
        const project = state?.projects?.find(p => p.id === segment);
        result.push({ label: project?.name || 'Проект', to: currentPath });
        continue;
      }

      // Standard routes
      const labelKey = ROUTE_LABELS[currentPath];
      if (labelKey) {
        result.push({ label: t(labelKey), to: currentPath });
      } else {
        // Dynamic segment — capitalize
        result.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1), to: currentPath });
      }
    }

    return result;
  }, [path, state]);

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground-foreground mb-4">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.to} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            {isLast ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="hover:text-foreground transition-colors">
                {i === 0 ? <Home className="w-3 h-3" /> : crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
