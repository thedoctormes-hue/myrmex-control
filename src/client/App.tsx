import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useMyrmex } from './hooks/useMyrmex';
import { useTheme } from './hooks/useTheme';
import { authStatus, logout as logoutApi, setUnauthorizedHandler } from './lib/api';
import { Sidebar } from './components/layout/Sidebar';
import { BottomBar } from './components/layout/BottomBar';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Board } from './pages/Board';
import { Library } from './pages/Library';
import { Files } from './pages/Files';
import { Graph } from './pages/Graph';
import { Login } from './pages/Login';
import { Setup } from './pages/Setup';

export default function App() {
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

  // При 401 — сбрасываем авторизацию
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuth(prev => ({ ...prev, authenticated: false }));
    });
  }, []);

  // Проверяем статус при загрузке
  useEffect(() => {
    authStatus()
      .then(status => {
        setAuth({
          checked: true,
          authenticated: status.authenticated,
          needsAuth: status.needsAuth,
          needsSetup: status.needsSetup ?? false,
          demo: status.demo ?? false,
        });
      })
      .catch(() => {
        setAuth({ checked: true, authenticated: false, needsAuth: false, needsSetup: false, demo: false });
      });
  }, []);

  const handleLogin = useCallback(() => {
    setAuth(prev => ({ ...prev, authenticated: true, needsSetup: false }));
    refresh();
  }, [refresh]);

  const handleSetup = useCallback(() => {
    setAuth(prev => ({ ...prev, authenticated: true, needsSetup: false, needsAuth: true }));
    refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    setAuth(prev => ({ ...prev, authenticated: false }));
  }, []);

  // Пока проверяем — загрузка
  if (!auth.checked || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-2xl animate-pulse">🐜 Загрузка муравейника...</div>
      </div>
    );
  }

  // Первичная настройка (пароль ещё не задан)
  if (auth.needsSetup) {
    return <Setup onSetup={handleSetup} />;
  }

  // Нужна авторизация — показываем логин (в демо-режиме пропускаем)
  if (auth.needsAuth && !auth.authenticated && !auth.demo) {
    return <Login onLogin={handleLogin} />;
  }

  // Ошибка загрузки данных
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomBar />
    </div>
  );
}
