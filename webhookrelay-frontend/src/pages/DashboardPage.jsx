import { Link } from 'react-router-dom';
import { useRelayData } from '../RelayDataContext';
import { AnimatedNumber } from '../components/AnimatedNumber';

function computeMetrics(deliveries, subscriptions) {
  const distinctEvents = new Set(deliveries.map((d) => d.eventId));
  const delivered = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const deadLettered = deliveries.filter((d) => d.status === 'DEAD_LETTERED').length;
  // Every attempt after the first is a retry — sum them across all deliveries.
  const retries = deliveries.reduce(
    (sum, d) => sum + Math.max(d.attemptCount - 1, 0),
    0
  );
  const activeSubscribers = subscriptions.filter((s) => s.active).length;

  // Only count deliveries that have reached a final state — a delivery
  // still PENDING on its first attempt hasn't succeeded or failed yet, so
  // including it would understate the rate for no reason.
  const settled = delivered + deadLettered;
  const successRate = settled === 0 ? null : Math.round((delivered / settled) * 100);

  return {
    eventsPublished: distinctEvents.size,
    delivered,
    retries,
    deadLettered,
    activeSubscribers,
    successRate,
  };
}

const TILES = [
  { key: 'eventsPublished', label: 'Events Published', className: 'tile-neutral', linkTo: '/app/deliveries' },
  { key: 'delivered', label: 'Successful Deliveries', className: 'tile-green', linkTo: '/app/deliveries' },
  { key: 'retries', label: 'Retries', className: 'tile-amber', linkTo: '/app/deliveries' },
  { key: 'deadLettered', label: 'Dead Letters', className: 'tile-red', linkTo: '/app/deliveries' },
  { key: 'activeSubscribers', label: 'Subscribers', className: 'tile-neutral', linkTo: '/app/subscriptions' },
];

const ONBOARDING_STEPS = [
  { to: '/app/subscriptions', label: 'Subscriptions', action: 'create one using a demo scenario' },
  { to: '/app/publish', label: 'Publish Event', action: "send an event matching that scenario's type" },
  { to: '/app/deliveries', label: 'Deliveries', action: 'watch it play out live' },
];

export function DashboardPage() {
  const { deliveries, subscriptions } = useRelayData();
  const metrics = computeMetrics(deliveries, subscriptions);

  return (
    <div>
      <div className="page-title-row">
        <h1>Dashboard</h1>
        <span className="live-badge">
          <span className="live-dot" /> Live · polling every 1.5s
        </span>
      </div>
      <p className="page-subtitle">
        Live view of the reliability engine — updates automatically.
      </p>

      <div className="metric-grid">
        {TILES.map((tile) => (
          <Link
            key={tile.key}
            to={tile.linkTo}
            className={`metric-tile metric-tile-link ${tile.className}`}
          >
            <div className="metric-value">
              <AnimatedNumber value={metrics[tile.key]} />
            </div>
            <div className="metric-label">{tile.label}</div>
          </Link>
        ))}
        <div className="metric-tile tile-neutral">
          <div className="metric-value">
            {metrics.successRate === null ? (
              '—'
            ) : (
              <>
                <AnimatedNumber value={metrics.successRate} />%
              </>
            )}
          </div>
          <div className="metric-label">Success Rate</div>
        </div>
      </div>

      {deliveries.length === 0 && (
        <div className="dashboard-empty-cta">
          <p>Nothing here yet. Start the story:</p>
          <ol className="onboarding-steps">
            {ONBOARDING_STEPS.map((step, i) => (
              <li key={step.to}>
                <span className="step-number">{i + 1}</span>
                <span>
                  Go to <Link to={step.to}>{step.label}</Link> and {step.action}.
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
