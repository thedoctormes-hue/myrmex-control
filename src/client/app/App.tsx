import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useMyrmex } from '../shared/hooks/useMyrmex';
import { useTheme } from '../shared/hooks/useTheme';
import { useSwipeNav } from '../shared/hooks/useSwipeNav';
import { authStatus, logout as logoutApi, setUnauthorizedHandler, setToken, getToken, getVersion } from '../shared/lib/api';
import { initTWA, isTWA, getTWAColorScheme, getTWAUser, haptic } from '../shared/lib/twa';
import { Sidebar } from '../shared/ui/Sidebar';
import { BottomBar } from '../shared/ui/BottomBar';
import { Dashboard } from '../pages/Dashboard';
import { Projects } from '../pages/Projects';
import { Board } from '../pages/Board';
import { Library } from '../pages/Library';
import { Files } from '../pages/Files';
import { Graph } from '../pages/Graph';
import { Login } from '../pages/Login';
import { Setup } from '../pages/Setup';
import { AuditLog } from '../pages/AuditLog';
import { Analytics } from '../pages/Analytics';

// Force-reload if Service Worker serves stale version
async function checkVersion() {
  try {
    const { version } = await getVersion();
    const stored = localStorage.getItem('app_version');
    if (stored && stored !== version) {
      console.log(`[Version] ${stored} → ${version}, reloading...`);
      localStorage.setItem('app_version', version);
      // Unregister old SW, clear caches, then reload
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

export default function App() {
  // Check version on mount and periodically — force reload if stale
  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, 60_000);
    return () => clearInterval(interval);
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

  // Swipe navigation between main sections
  const mainRoutes = ['/', '/projects', '/analytics', '/audit', '/graph'];
  useSwipeNav(mainRoutes);

  // Initialize Telegram Web App
  useEffect(() => {
    initTWA();

    // If TWA provides a color scheme, apply it
    const twaScheme = getTWAColorScheme();
    if (twaScheme) {
      const root = document.documentElement;
      if (twaScheme === 'light') root.classList.remove('dark');
      else root.classList.add('dark');
    }

    // Log TWA user for debugging
    const twaUser = getTWAUser();
    if (twaUser) {
      console.log(`[TWA] Running inside Telegram as @${twaUser.username ?? twaUser.id}`);
    }
  }, []);

  // On 401 — reset auth
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setAuth(prev => ({ ...prev, authenticated: false }));
    });
  }, []);

  // Check auth on mount
  useEffect(() => {
    authStatus()
      .then(status => {
        if (status.authenticated && status.user) {
          // We have a valid session — try to get a fresh token
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
    refresh();
  }, [refresh]);

  const handleSetup = useCallback((token: string) => {
    setToken(token);
    setAuth(prev => ({ ...prev, authenticated: true, needsSetup: false, needsAuth: true }));
    refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    setToken(null);
    setAuth(prev => ({ ...prev, authenticated: false }));
  }, []);

  // Loading
  if (!auth.checked || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl animate-pulse">🐜 Загрузка муравейника...</div>
      </div>
    );
  }

  // First-time setup
  if (auth.needsSetup) {
    return <Setup onSetup={handleSetup} />;
  }

  // Need auth — show login (skip in demo)
  if (auth.needsAuth && !auth.authenticated && !auth.demo) {
    return <Login onLogin={handleLogin} />;
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {auth.demo && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black text-center text-sm py-1 font-medium">
          🎮 Демо-режим — данные сбрасываются каждый час
        </div>
      )}
      <Sidebar state={state} theme={theme} onToggleTheme={toggle} onLogout={auth.needsAuth && !auth.demo ? handleLogout : undefined} />
      <main className={`flex-1 overflow-auto p-4 md:p-6 pb-16 md:pb-6 ${auth.demo ? 'pt-8' : ''}`}>
        <Routes>
          <Route path="/" element={<Dashboard state={state} onRefresh={refresh} />} />
          <Route path="/projects" element={<Projects state={state} onRefresh={refresh} />} />
          <Route path="/project/:id" element={<Board state={state} onRefresh={refresh} />} />
          <Route path="/library" element={<Library state={state} onRefresh={refresh} />} />
          <Route path="/files" element={<Files />} />
          <Route path="/graph" element={<Graph state={state} />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomBar />
    </div>
  );
}
