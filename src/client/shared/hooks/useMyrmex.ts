import { useState, useEffect, useCallback } from 'react';
import type { MyrmexState } from '@shared/types';
import { getState } from '../lib/api';

export function useMyrmex() {
  const [state, setState] = useState<MyrmexState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await getState();
      setState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30s — silent (no loading spinner)
  useEffect(() => {
    const interval = setInterval(() => refresh(false), 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { state, loading, error, refresh };
}
