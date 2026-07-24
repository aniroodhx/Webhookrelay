import { useEffect } from 'react';

// A brief, self-dismissing confirmation banner. Used instead of inline text
// for the "event queued" moment so it reads as a distinct event, not a
// static line of copy sitting in the form.
export function Toast({ message, onDismiss, durationMs = 3000 }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [onDismiss, durationMs]);

  if (!message) return null;

  return (
    <div className="toast">
      <span className="toast-check">✓</span>
      {message}
    </div>
  );
}
