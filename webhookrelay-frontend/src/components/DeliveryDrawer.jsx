import { useEffect, useState } from 'react';
import { STATUS_META, MAX_ATTEMPTS, secondsUntil, formatResponseCode } from '../deliveryHelpers';

export function DeliveryDrawer({ delivery, onClose }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!delivery) return null;

  const meta = STATUS_META[delivery.status] || { label: delivery.status, className: '' };
  const countdown = secondsUntil(delivery.nextAttemptAt, now);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Delivery detail</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="drawer-status-row">
          <span className={`status-pill ${meta.className}`}>{meta.label}</span>
          <span className="attempt-fraction">
            Attempt {delivery.attemptCount} / {MAX_ATTEMPTS}
          </span>
        </div>

        {delivery.status === 'PENDING' && countdown !== null && (
          <div className="drawer-countdown">
            <div className="countdown-number">{countdown}s</div>
            <div className="countdown-caption">until next retry</div>
            <div className="countdown-bar-track">
              <div
                className="countdown-bar-fill"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (1 - countdown / 30) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        <dl className="drawer-fields">
          <dt>Event type</dt>
          <dd>{delivery.eventType}</dd>

          <dt>Event ID</dt>
          <dd><code>{delivery.eventId}</code></dd>

          <dt>Subscription ID</dt>
          <dd><code>{delivery.subscriptionId}</code></dd>

          <dt>Target URL</dt>
          <dd className="drawer-url"><code>{delivery.targetUrl}</code></dd>

          <dt>Last response code</dt>
          <dd>{formatResponseCode(delivery.lastResponseCode) ?? 'no response yet'}</dd>

          <dt>Last latency</dt>
          <dd>{delivery.attemptCount > 0 ? `${delivery.lastLatencyMs}ms` : '—'}</dd>

          <dt>Last attempt at</dt>
          <dd>
            {delivery.lastAttemptAt
              ? new Date(delivery.lastAttemptAt).toLocaleTimeString()
              : 'not yet attempted'}
          </dd>
        </dl>

        <p className="drawer-hint">
          Every delivery is signed with HMAC-SHA256 (<code>X-Webhook-Signature</code>)
          and carries an <code>X-Idempotency-Key</code> header — the subscriber
          verifies the signature and can safely ignore a duplicate delivery of
          the same event.
        </p>
      </aside>
    </div>
  );
}
