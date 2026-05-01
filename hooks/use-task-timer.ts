import { useEffect, useState } from 'react';
import { inProgressStore } from '@/services/in-progress-store';

/**
 * Subscribes to the in-progress store for a single task. While the timer is
 * running, re-renders every second so the consumer can show live elapsed.
 *
 * Wall-clock: elapsed = Date.now() - startedAt (counts during background).
 */
export function useTaskTimer(taskId: string) {
  const [startedAt, setStartedAt] = useState<number | undefined>(() =>
    inProgressStore.getStartedAt(taskId),
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    inProgressStore.init().then(() => {
      if (mounted) setStartedAt(inProgressStore.getStartedAt(taskId));
    });
    const unsub = inProgressStore.subscribe(() => {
      if (mounted) setStartedAt(inProgressStore.getStartedAt(taskId));
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [taskId]);

  useEffect(() => {
    if (startedAt == null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const isRunning = startedAt != null;
  const elapsedMs = isRunning ? Date.now() - (startedAt ?? 0) : 0;

  return { isRunning, elapsedMs };
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}
