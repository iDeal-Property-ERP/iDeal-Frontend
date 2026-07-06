'use client';

import { useCallback, useRef } from 'react';

/**
 * Fires a callback after a press-and-hold, used to enter selection mode on the
 * mobile Payments list (Figma "Long-press → selection mode"). Cancels on move or
 * early release so it never competes with a tap or a horizontal swipe.
 * @param onLongPress - Called once the hold threshold is reached.
 * @param ms - The hold duration in milliseconds (defaults to 400).
 * @returns Touch/pointer handlers to spread onto the target element.
 */
export function useLongPress(onLongPress: () => void, ms = 400) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    timer.current = setTimeout(() => {
      onLongPress();
    }, ms);
  }, [clear, ms, onLongPress]);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
  };
}
