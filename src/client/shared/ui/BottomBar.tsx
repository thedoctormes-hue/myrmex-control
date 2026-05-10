import { NavLink } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Дашборд', icon: '📊' },
  { to: '/projects', label: 'Проекты', icon: '📁' },
  { to: '/library', label: 'Библиотека', icon: '📚' },
  { to: '/files', label: 'Файлы', icon: '📂' },
  { to: '/analytics', label: 'Аналитика', icon: '📈' },
  { to: '/audit', label: 'Аудит', icon: '📋' },
  { to: '/graph', label: 'Граф', icon: '🕸️' },
];

export function BottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-12">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`
            }
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="text-[8px] mt-0.5 leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
