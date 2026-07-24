import { useEffect, useRef, useState } from 'react';

// Briefly flashes the tile when its value changes, so a metric ticking up
// during a live demo is visibly "live" instead of silently updating.
export function AnimatedNumber({ value }) {
  const [pulsing, setPulsing] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setPulsing(true);
      const id = setTimeout(() => setPulsing(false), 500);
      return () => clearTimeout(id);
    }
  }, [value]);

  return (
    <span className={pulsing ? 'metric-value-pulse' : ''}>{value}</span>
  );
}
