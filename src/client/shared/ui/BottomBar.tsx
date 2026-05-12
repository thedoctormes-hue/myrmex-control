import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Library, BarChart3, ClipboardList } from 'lucide-react';

const nav = [
  { to: '/', label: 'Дашборд', icon: LayoutDashboard },
  { to: '/projects', label: 'Проекты', icon: FolderKanban },
  { to: '/library', label: 'Библиотека', icon: Library },
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/audit', label: 'Аудит', icon: ClipboardList },
];

export function BottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-14">
        {nav.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 leading-none font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
