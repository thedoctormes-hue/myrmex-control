import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptic } from '../lib/twa';

/**
 * Swipe-based navigation for mobile.
 *
 * Swipe right from left edge → go back
 * Swipe left/right on bottom bar → switch between main sections
 *
 * @param navRoutes - ordered list of main navigation routes
 * @param threshold - minimum swipe distance in px (default 80)
 */
export function useSwipeNav(
  navRoutes: string[],
  threshold = 80
) {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;

    // Only handle fast, horizontal swipes
    if (dt > 500 || Math.abs(dy) > Math.abs(dx) * 0.6) {
      touchStart.current = null;
      return;
    }

    // Swipe right from left edge → go back
    if (dx > threshold && touchStart.current.x < 40) {
      haptic('selection');
      navigate(-1);
      touchStart.current = null;
      return;
    }

    // Swipe left/right → switch between main sections
    if (Math.abs(dx) > threshold) {
      const currentIdx = navRoutes.indexOf(location.pathname);
      if (currentIdx === -1) return;

      if (dx < 0 && currentIdx < navRoutes.length - 1) {
        // Swipe left → next section
        haptic('selection');
        navigate(navRoutes[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        // Swipe right → previous section
        haptic('selection');
        navigate(navRoutes[currentIdx - 1]);
      }
    }

    touchStart.current = null;
  }, [navigate, location.pathname, navRoutes, threshold]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
}
