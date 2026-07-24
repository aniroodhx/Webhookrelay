import { useEffect, useRef, useState } from 'react';

// Polls `fetcher` on an interval and exposes the latest result. Used to give
// the dashboard a "live" feel without needing websockets for a demo project.
//
// `trigger` is any value that should force an immediate refetch when it
// changes (e.g. bump a counter right after creating a subscription, instead
// of waiting for the next interval tick).
export function usePolling(fetcher, intervalMs = 1500, trigger = 0) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, trigger]);

  return { data, error };
}
