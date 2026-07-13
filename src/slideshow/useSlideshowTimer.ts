import { useEffect, useMemo, useState } from "react";

type TimerArgs = {
  durationSeconds: number;
  active: boolean;
  paused: boolean;
  resetKey: string | number;
  onComplete: () => void;
};

export function useSlideshowTimer({ durationSeconds, active, paused, resetKey, onComplete }: TimerArgs) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);

  useEffect(() => {
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds, resetKey]);

  useEffect(() => {
    if (!active || paused) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onComplete();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, paused, onComplete]);

  const progress = useMemo(() => {
    if (durationSeconds <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (remainingSeconds / durationSeconds) * 100));
  }, [durationSeconds, remainingSeconds]);

  return { remainingSeconds, progress, reset: () => setRemainingSeconds(durationSeconds) };
}
