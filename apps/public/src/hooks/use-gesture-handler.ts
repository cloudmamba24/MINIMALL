'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';

interface GestureConfig {
  onSwipeLeft?: (() => void) | undefined;
  onSwipeRight?: (() => void) | undefined;
  onSwipeUp?: (() => void) | undefined;
  onSwipeDown?: (() => void) | undefined;
  onPullToClose?: (() => void) | undefined;
  threshold?: number | undefined;
  preventScrollOnSwipe?: boolean | undefined;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export function useGestureHandler({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToClose,
  threshold = 50,
  preventScrollOnSwipe = false
}: GestureConfig) {
  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);
  const [isGesturing, setIsGesturing] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    touchEnd.current = null;
    setIsGesturing(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Calculate current swipe distance
    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;

    // Prevent scroll if horizontal swipe is detected and preventScrollOnSwipe is true
    if (preventScrollOnSwipe && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      e.preventDefault();
      setIsGesturing(true);
    }

    // Handle pull to close (swipe down from top)
    if (onPullToClose && deltaY > threshold * 2 && Math.abs(deltaX) < threshold) {
      // Check if starting from top area
      const startedFromTop = touchStart.current.y < 100;
      if (startedFromTop) {
        setIsGesturing(true);
      }
    }
  }, [threshold, onPullToClose, preventScrollOnSwipe]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    // Ignore very slow gestures (> 500ms)
    if (deltaTime > 500) {
      setIsGesturing(false);
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Only trigger if movement exceeds threshold
    if (absX < threshold && absY < threshold) {
      setIsGesturing(false);
      return;
    }

    // Determine swipe direction
    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > threshold && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < -threshold && onSwipeUp) {
        onSwipeUp();
      }
      
      // Special case for pull to close
      if (onPullToClose && deltaY > threshold * 2 && touchStart.current.y < 100) {
        onPullToClose();
      }
    }

    setIsGesturing(false);
    touchStart.current = null;
    touchEnd.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onPullToClose]);

  const gestureProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: {
      touchAction: preventScrollOnSwipe ? 'pan-y' : 'auto'
    }
  };

  return {
    gestureProps,
    isGesturing
  };
}

// Hook for modal gesture support
export function useModalGestures(onClose?: () => void, onNext?: () => void, onPrev?: () => void) {
  return useGestureHandler({
    onSwipeDown: onClose,
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
    onPullToClose: onClose,
    threshold: 60,
    preventScrollOnSwipe: true
  });
}

// Hook for tab navigation gestures
export function useTabGestures(onNext?: () => void, onPrev?: () => void) {
  return useGestureHandler({
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
    threshold: 80,
    preventScrollOnSwipe: false
  });
}