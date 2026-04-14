import { useState, useEffect, useCallback } from 'react';

export function useOtpTimer(initialSeconds = 60) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [isActive, seconds]);

  useEffect(() => {
    if (seconds <= 0) setIsActive(false);
  }, [seconds]);

  const restart = useCallback(() => {
    setSeconds(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  return { seconds, isActive, canResend: !isActive, restart };
}
