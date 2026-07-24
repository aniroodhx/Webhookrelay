import { useState } from 'react';
import { useRelayData } from '../RelayDataContext';
import { DeliveriesPanel } from '../components/DeliveriesPanel';
import { BACKOFF_STAGES_SECONDS } from '../deliveryHelpers';
import { api } from '../api';

const LADDER_LABELS = [...BACKOFF_STAGES_SECONDS.map((s) => `${s}s`), 'Dead letter'];

// Picks the single delivery whose retry state is most worth highlighting on
// the ladder: the most recently active one, so the strip reflects whatever
// is actually in progress right now rather than an arbitrary row.
function findHighlightDelivery(deliveries) {
  const withActivity = deliveries.filter((d) => d.lastAttemptAt);
  if (withActivity.length === 0) return null;
  return withActivity.reduce((latest, d) =>
    new Date(d.lastAttemptAt) > new Date(latest.lastAttemptAt) ? d : latest
  );
}

// index of the ladder stage that's currently "active" for this delivery.
// attemptCount N means N attempts have already happened; the delay before
// the next one doubles from base each time, so the upcoming stage is
// index (N - 1) — clamped to the last backoff stage before dead-lettering.
function activeStageIndex(delivery) {
  if (!delivery) return -1;
  if (delivery.status === 'DEAD_LETTERED') return LADDER_LABELS.length - 1;
  if (delivery.status !== 'PENDING' || delivery.attemptCount < 1) return -1;
  return Math.min(delivery.attemptCount - 1, LADDER_LABELS.length - 2);
}

export function DeliveriesPage() {
  const { deliveries, deliveriesError } = useRelayData();
  const highlight = findHighlightDelivery(deliveries);
  const activeIndex = activeStageIndex(highlight);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    if (!window.confirm('Clear all deliveries and events? Subscriptions are kept.')) {
      return;
    }
    setClearing(true);
    try {
      await api.clearDeliveries();
      // The 1.5s poll picks up the now-empty list on its next tick.
    } catch {
      // Non-fatal for a demo reset — the poll will still reflect reality.
    } finally {
      setClearing(false);
    }
  };

  return (
    <div>
      <div className="page-title-row">
        <h1>Deliveries</h1>
        {deliveries.length > 0 && (
          <button
            type="button"
            className="link-button"
            onClick={handleClear}
            disabled={clearing}
          >
            {clearing ? 'Clearing…' : 'Clear all'}
          </button>
        )}
      </div>
      <p className="page-subtitle">
        Step 3: this is where the retry engine becomes visible.
      </p>

      <div className="retry-ladder">
        {LADDER_LABELS.map((stage, i) => {
          const isDone = activeIndex >= 0 && i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={stage} className="retry-ladder-step-wrapper">
              <div
                className={
                  'retry-ladder-step' +
                  (isDone ? ' ladder-done' : '') +
                  (isActive ? ' ladder-active' : '')
                }
              >
                {isDone && <span className="ladder-check">✓</span>}
                {stage}
              </div>
              {i < LADDER_LABELS.length - 1 && (
                <span className="retry-ladder-arrow">→</span>
              )}
            </div>
          );
        })}
      </div>

      <DeliveriesPanel deliveries={deliveries} error={deliveriesError} />
    </div>
  );
}