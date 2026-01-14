import { useEffect, useRef } from 'react';
import { logout } from '@/services/authApi';

export default function useIdleTimeout(timeoutMinutes = 60) {
  const logoutTimer = useRef(null);

  const resetTimer = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }
    
    // Set timeout for auto logout (60 minutes default)
    logoutTimer.current = setTimeout(() => {
      const shouldLogout = window.confirm(
        'You have been inactive for a while. Would you like to stay logged in?'
      );
      
      if (!shouldLogout) {
        logout();
      } else {
        resetTimer(); // Reset timer if user wants to stay
      }
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Events that reset the timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, [timeoutMinutes]);
}