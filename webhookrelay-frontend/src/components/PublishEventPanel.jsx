import { useState } from 'react';
import { api } from '../api';
import { Toast } from './Toast';

export function PublishEventPanel({ eventTypes, onPublished }) {
  const [eventType, setEventType] = useState('order.created');
  const [payload, setPayload] = useState('{\n  "orderId": 123\n}');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePublish = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      // Validate JSON client-side so a typo doesn't silently become a
      // string payload the backend has to reject.
      JSON.parse(payload);

      const { event, wasDuplicate } = await api.publishEvent({
        eventType,
        payload,
        idempotencyKey: idempotencyKey || undefined,
      });

      setToastMessage(
        wasDuplicate
          ? `Duplicate detected — idempotency key already seen, skipped (${event.id.slice(0, 8)})`
          : `Event queued (${event.id.slice(0, 8)}) — fanning out to subscribers`
      );
      onPublished();
    } catch (err) {
      setErrorMsg(
        err instanceof SyntaxError ? `Payload isn't valid JSON: ${err.message}` : err.message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <h2>Publish event</h2>
      <p className="panel-hint">
        Fans out to every active subscription for this event type.
        Re-publishing with the same idempotency key returns the original
        event instead of creating a duplicate.
      </p>

      <form onSubmit={handlePublish} className="form-grid">
        <label>
          Event type
          <input
            list="known-event-types"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            required
          />
          <datalist id="known-event-types">
            {eventTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <label>
          Payload (JSON)
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={5}
            spellCheck={false}
          />
        </label>

        <label>
          Idempotency key <span className="optional-tag">optional</span>
          <input
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            placeholder="auto-generated if left blank"
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish event'}
        </button>
      </form>

      {errorMsg && <p className="error-text">{errorMsg}</p>}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </section>
  );
}
