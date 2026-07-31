import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to manage Vault Privacy & Auto-Lock
 * Locks the app if window is out of focus or user is idle.
 * Lock duration is read dynamically from localStorage.
 */
export default function useAutoLock() {
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('VAULTX_IS_LOCKED') === 'true';
  });
  
  const blurTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  const getTimeoutMs = useCallback(() => {
    const lockMinutes = parseInt(localStorage.getItem('VAULTX_AUTOLOCK_MINUTES') || '15', 10);
    return lockMinutes * 60 * 1000;
  }, []);

  const lockVault = useCallback(() => {
    setIsLocked(true);
    localStorage.setItem('VAULTX_IS_LOCKED', 'true');
  }, []);

  const unlockVault = useCallback(() => {
    setIsLocked(false);
    localStorage.removeItem('VAULTX_IS_LOCKED');
    resetIdleTimer(); // Restart idle timer upon unlocking
  }, []);

  // Sync lock state across multiple tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'VAULTX_IS_LOCKED') {
        setIsLocked(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (isLocked) return; // Don't reset if already locked
    
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      lockVault();
    }, getTimeoutMs());
  }, [isLocked, lockVault, getTimeoutMs]);

  // Handle Window Focus/Blur
  useEffect(() => {
    const handleBlur = () => {
      if (isLocked) return;
      blurTimerRef.current = setTimeout(() => {
        lockVault();
      }, getTimeoutMs());
    };

    const handleFocus = () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
      resetIdleTimer();
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, [isLocked, lockVault, resetIdleTimer, getTimeoutMs]);

  // Handle Idle State (Mouse/Keyboard activity)
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetIdleTimer();
    };

    // Initialize timer
    resetIdleTimer();

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    // Listen for setting changes
    const handleSettingChange = () => resetIdleTimer();
    window.addEventListener('autolock_changed', handleSettingChange);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      window.removeEventListener('autolock_changed', handleSettingChange);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  return { isLocked, lockVault, unlockVault };
}
