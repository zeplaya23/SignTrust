import { useEffect, useState } from 'react';

export function useOtpTimer(initialSeconds = 60) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  return { seconds, expired: seconds <= 0, reset: () => setSeconds(initialSeconds) };
}
