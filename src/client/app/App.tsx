import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useMyrmex } from '../shared/hooks/useMyrmex';
import { useTheme } from '../shared/hooks/useTheme';
import { useSwipeNav } from '../shared/hooks/useSwipeNav';
import { authStatus, logout as logoutApi, setUnauthorizedHandler, setToken, getToken, getVersion } from '../shared/lib/api';
import { initTWA, expandTWA, getTWAColorScheme, getTWAUser } from '../shared/lib/twa';
import { Sidebar } from '../shared/ui/Sidebar';
import { BottomBar } from '../shared/ui/BottomBar';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';
import { DashboardSkeleton } from '../shared/ui/Skeleton';
import { NotificationProvider } from '../shared/ui/Notifications';
import { Breadcrumbs } from '../shared/ui/Breadcrumbs';
import { CommandPalette, useCommandPalette } from '../shared/ui/CommandPalette';
import { ConfirmProvider } from '../shared/ui/ConfirmDialog';
import { Onboarding } from '../pages/Onboarding';
import { ProfileDropdown } from '../shared/ui/ProfileDropdown';

// Lazy-loaded pages — code splitting
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Projects = lazy(() => import('../pages/Projects'));
const Board = lazy(() => import('../pages/Board'));
const Library = lazy(() => import('../pages/Library'));
const Files = lazy(() => import('../pages/Files'));
const Graph = lazy(() => import('../pages/Graph'));
const Login = lazy(() => import('../pages/Login'));
const Setup = lazy(() => import('../pages/Setup'));
const AuditLog = lazy(() => import('../pages/AuditLog'));
const Analytics = lazy(() => import('../pages/Analytics'));
const Agents = lazy(() => import('../pages/Agents'));
const Servers = lazy(() => import('../pages/Servers'));
const Settings = lazy(() => import('../pages/Settings'));
const Chat = lazy(() => import('../pages/Chat'));
const Artifacts = lazy(() => import('../pages/Artifacts'));
const Knowledge = lazy(() => import('../pages/Knowledge'));
const Sessions = lazy(() => import('../pages/Sessions'));
const Evolution = lazy(() => import('../pages/Evolution'));
const Pricing = lazy(() => import('../pages/Pricing'));

// Force-reload if Service Worker serves stale version
async function checkVersion() {
  try {
    const { version } = await getVersion();
    const stored = localStorage.getItem('app_version');
    if (stored && stored !== version) {
      console.log(`[Version] ${stored} → ${version}, reloading...`);
      localStorage.setItem('app_version', version);
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      window.location.reload();
    } else if (!stored) {
      localStorage.setItem('app_version', version);
    }
  } catch {
    // Server unreachable — skip version check
  }
}

function hideSplash() {
  const splash = document.getElementById('twa-splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 400);
  }
}

export default function App() {
  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Hide splash screen once React mounts
  useEffect(() => {
    // Small delay to ensure first paint
    const timer = setTimeout(hideSplash, 300);
    return () => clearTimeout(timer);
  }, []);

  const { state, loading, error, refresh } = useMyrmex();
  const { theme, toggle } = useTheme();
  const [auth, setAuth] = useState<{
    checked: boolean;
    authenticated: boolean;
    needsAuth: boolean;
    needsSetup: boolean;
    demo: boolean;
  }>({
    checked: false,
    authenticated: false,
    needsAuth: false,
    needsSetup: false,
    demo: false,
  });

  const mainRoutes = ['/', '/projects', '/agents', '/library', '/files', '/servers', '/analytics', '/audit', '/settings'];
  useSwipeNav(mainRoutes);
  const navigate = useNavigate();
  const { isOpen, setIsOpen, commands } = useCommandPalette((path: string) => {
    navigate(path);
  });
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('myrmex_onboarded');
  });

  useEffect(() => {
    initTWA();
    const twaScheme = getTWAColorScheme();
    if (twaScheme) {
      const root = document.documentElement;
      if (twaScheme === 'light') root.classList.remove('dark');
      else root.classList.add('dark');
    }
    const twaUser = getTWAUser();
    if (twaUser) {
      console.log(`[TWA] Running inside Telegram as @${twaUser.username ?? twaUser.id}`);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setAuth(prev => ({ ...prev, authenticated: false }));
    });
  }, []);

  useEffect(() => {
    authStatus()
      .then(status => {
        if (status.authenticated && status.user) {
          if (getToken()) {
            setAuth({ checked: true, authenticated: true, needsAuth: false, needsSetup: false, demo: status.demo ?? false });
          } else {
            setAuth({ checked: true, authenticated: false, needsAuth: status.needsAuth, needsSetup: status.needsSetup ?? false, demo: status.demo ?? false });
          }
        } else {
          setAuth({ checked: true, authenticated: false, needsAuth: status.needsAuth, needsSetup: status.needsSetup ?? false, demo: status.demo ?? false });
        }
      })
      .catch(() => {
        setAuth({ checked: true, authenticated: false, needsAuth: false, needsSetup: false, demo: false });
      });
  }, []);

  const handleLogin = useCallback((token: string) => {
    setToken(token);
    setAuth(prev => ({ ...prev, authenticated: true, needsSetup: false }));
    expandTWA();
    refresh();
  }, [refresh]);

  const handleSetup = useCallback((token: string) => {
    setToken(token);
    setAuth(prev => ({ ...prev, authenticated: true, needsSetup: false, needsAuth: true }));
    expandTWA();
    refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    setToken(null);
    setAuth(prev => ({ ...prev, authenticated: false }));
  }, []);

  // Loading — shown after splash fades, while auth/state loads
  if (!auth.checked || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <svg width="64" height="64" viewBox="0 0 512 512" className="animate-pulse">
          <rect width="512" height="512" rx="96" fill="#0f172a"/>
          <g fill="#f59e0b" opacity="0.9">
            <path d="M256 300 L310 270 L340 290 L330 340 L280 360 L240 350 L230 320 Z"/>
            <polygon points="256,260 270,240 256,220 242,240"/>
            <path d="M256 220 L290 195 L300 210 L285 240 L256 250 L225 240 L210 210 L220 195 Z"/>
            <path d="M256 150 L280 170 L275 195 L256 205 L237 195 L232 170 Z"/>
          </g>
          <g stroke="#f59e0b" stroke-width="4" stroke-linecap="round" fill="none">
            <path d="M237 170 L200 130 L185 135"/>
            <path d="M275 170 L312 130 L327 135"/>
            <path d="M220 195 L170 175 L150 185"/>
            <path d="M290 195 L340 175 L360 185"/>
            <path d="M210 230 L155 235 L135 225"/>
            <path d="M300 230 L355 235 L375 225"/>
            <path d="M230 270 L180 290 L160 280"/>
            <path d="M285 270 L335 290 L355 280"/>
          </g>
          <g fill="#f59e0b">
            <circle cx="185" cy="135" r="5"/>
            <circle cx="327" cy="135" r="5"/>
            <circle cx="150" cy="185" r="4"/>
            <circle cx="360" cy="185" r="4"/>
            <circle cx="135" cy="225" r="4"/>
            <circle cx="375" cy="225" r="4"/>
            <circle cx="160" cy="280" r="4"/>
            <circle cx="355" cy="280" r="4"/>
          </g>
        </svg>
        <p className="mt-4 text-sm text-muted-foreground-foreground animate-pulse">Загрузка муравейника...</p>
      </div>
    );
  }

  // First-time setup
  if (auth.needsSetup) {
    return (
      <ErrorBoundary>
        <Setup onSetup={handleSetup} />
      </ErrorBoundary>
    );
  }

  // Need auth — show login (skip in demo)
  if (auth.needsAuth && !auth.authenticated && !auth.demo) {
    return (
      <ErrorBoundary>
        <Login onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="text-2xl text-destructive mb-4">⚠️ Ошибка: {error}</div>
          <button onClick={refresh} className="px-4 py-2 bg-primary text-primary-foreground rounded">
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {auth.demo && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center text-sm py-1 font-medium">
            🎮 Демо-режим — данные сбрасываются каждый час
          </div>
        )}
        <Sidebar state={state} theme={theme} onToggleTheme={toggle} onLogout={auth.needsAuth && !auth.demo ? handleLogout : undefined} />
        <main className={`flex-1 overflow-auto p-4 md:p-6 pb-16 md:pb-6 animate-fade-in ${auth.demo ? 'pt-8' : ''}`}>
          {/* Header with profile */}
          <div className="flex items-center justify-between mb-4">
            <Breadcrumbs state={state} />
            <ProfileDropdown
              username={auth.authenticated ? 'DoctorM' : undefined}
              role="admin"
              theme={theme}
              onToggleTheme={toggle}
              onLogout={auth.needsAuth && !auth.demo ? handleLogout : undefined}
              onOpenSettings={() => navigate('/settings')}
              onOpenShortcuts={() => setIsOpen(true)}
            />
          </div>
          <Suspense fallback={<DashboardSkeleton />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard state={state} onRefresh={refresh} />} />
                <Route path="/projects" element={<Projects state={state} onRefresh={refresh} />} />
                <Route path="/project/:id" element={<Board state={state} onRefresh={refresh} />} />
                <Route path="/board/:owner" element={<Board state={state} onRefresh={refresh} />} />
                <Route path="/agents" element={<Agents state={state} onRefresh={refresh} />} />
                <Route path="/library" element={<Library state={state} onRefresh={refresh} />} />
                <Route path="/files" element={<Files />} />
                <Route path="/servers" element={<Servers state={state} onRefresh={refresh} />} />
                <Route path="/graph" element={<Graph state={state} />} />
                <Route path="/audit" element={<AuditLog />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/chat" element={<Chat state={state} />} />
                <Route path="/artifacts" element={<Artifacts />} />
                <Route path="/knowledge" element={<Knowledge />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/evolution" element={<Evolution />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </main>
        <BottomBar />
      </div>
      {showOnboarding && (
        <Onboarding onComplete={() => {
          localStorage.setItem('myrmex_onboarded', '1');
          setShowOnboarding(false);
        }} />
      )}
      <ConfirmProvider>
        <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} commands={commands} />
      </ConfirmProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
