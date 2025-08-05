import { useEffect, useRef } from 'react';

interface UseAutoLogoutProps {
  onLogout: () => void;
  timeoutMinutes?: number;
}

export function useAutoLogout({ onLogout, timeoutMinutes = 10 }: UseAutoLogoutProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    lastActivityRef.current = Date.now();
    
    timeoutRef.current = setTimeout(() => {
      onLogout();
    }, timeoutMinutes * 60 * 1000);
  };

  const handleActivity = () => {
    resetTimeout();
  };

  useEffect(() => {
    // Set initial timeout
    resetTimeout();

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [timeoutMinutes]);

  return { resetTimeout };
}