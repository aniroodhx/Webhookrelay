import { useEffect, useState } from 'react';
import { STATUS_META, MAX_ATTEMPTS, secondsUntil, formatResponseCode } from '../deliveryHelpers';
import { DeliveryDrawer } from './DeliveryDrawer';

// Re-renders once a second purely so the "retrying in Ns" countdowns tick
// down live between polling cycles, without needing a fetch every second.
function useClockTick(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function DeliveriesPanel({ deliveries, error }) {
  const now = useClockTick();
  const [selectedId, setSelectedId] = useState(null);

  const sorted = [...(deliveries || [])].sort((a, b) => {
    const at = a.lastAttemptAt ? new Date(a.lastAttemptAt).getTime() : 0;
    const bt = b.lastAttemptAt ? new Date(b.lastAttemptAt).getTime() : 0;
    return bt - at;
  });

  const selected = sorted.find((d) => d.id === selectedId) || null;

  return (
    <section className="panel panel-wide">
      <h2>Deliveries</h2>
      <p className="panel-hint">
        Live view of every delivery attempt. Click a row for full detail —
        payload target, response history, and retry countdown.
      </p>

      {error && (
        <p className="error-text">
          Couldn't reach the backend: {error.message}
        </p>
      )}

      {sorted.length === 0 && !error && (
        <p className="empty-state">
          No deliveries yet — publish an event to see one appear.
        </p>
      )}

      {sorted.length > 0 && (
        <table className="deliveries-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Last response</th>
              <th>Latency</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const meta = STATUS_META[d.status] || { label: d.status, className: '' };
              const countdown = secondsUntil(d.nextAttemptAt, now);

              return (
                <tr
                  key={d.id}
                  className="clickable-row"
                  onClick={() => setSelectedId(d.id)}
                >
                  <td>
                    <div className="event-cell">
                      <span className="badge">{d.eventType}</span>
                      <code className="event-id">{d.eventId.slice(0, 8)}</code>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${meta.className}`}>
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <div className="attempt-cell">
                      {d.attemptCount} / {MAX_ATTEMPTS}
                    </div>
                    {d.status === 'PENDING' && countdown !== null && (
                      <div className="countdown">next retry in {countdown}s</div>
                    )}
                  </td>
                  <td>
                    {d.lastResponseCode != null ? (
                      <span className={d.lastResponseCode >= 400 ? 'response-bad' : 'response-good'}>
                        {formatResponseCode(d.lastResponseCode)}
                      </span>
                    ) : (
                      <span className="muted">no response</span>
                    )}
                  </td>
                  <td>{d.attemptCount > 0 ? `${d.lastLatencyMs}ms` : '—'}</td>
                  <td>
                    <code className="target-url" title={d.targetUrl}>
                      {d.targetUrl}
                    </code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selected && (
        <DeliveryDrawer delivery={selected} onClose={() => setSelectedId(null)} />
      )}
    </section>
  );
}
