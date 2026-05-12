import { NavLink } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Дашборд', icon: '📊' },
  { to: '/projects', label: 'Проекты', icon: '📁' },
  { to: '/library', label: 'Библиотека', icon: '📚' },
  { to: '/files', label: 'Файлы', icon: '📂' },
  { to: '/graph', label: 'Граф', icon: '🕸️' },
];

export function BottomBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex justify-around items-center h-14">
        {nav.map(item => (
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
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
