import { Link } from 'react-router-dom';

const DECISIONS = [
  {
    title: 'Exponential backoff over fixed-interval retry',
    body: `A failing endpoint is often failing because it's overloaded — hammering it
    every second makes that worse. Backoff (1s → 2s → 4s → 8s → 16s, capped at
    5 attempts) gives a struggling endpoint room to recover, and caps total
    retry cost instead of retrying forever.`,
  },
  {
    title: 'HMAC-SHA256 signing, not just HTTPS',
    body: `HTTPS proves the transport is encrypted; it doesn't prove we sent the
    payload versus someone who guessed the subscriber's URL. Every delivery is
    signed with a per-subscription secret, verified via constant-time
    comparison (MessageDigest.isEqual) to avoid leaking timing information
    that could help an attacker brute-force the signature.`,
  },
  {
    title: 'Idempotency keys on publish, not just delivery',
    body: `Retry logic on the delivery side is the obvious half of this problem.
    The less obvious half: what if the producer retries their own publish
    call after a timeout, not realizing it actually succeeded? Without an
    idempotency key, that creates a duplicate event and double-delivers to
    every subscriber. Deduping on publish closes that gap.`,
  },
  {
    title: 'Dead-lettering instead of infinite retry',
    body: `After 5 failed attempts, a delivery moves to DEAD_LETTERED rather than
    retrying forever. An endpoint that's been down for 5 exponentially-spaced
    attempts needs a human to look at it, not a background thread quietly
    burning resources on a call that will keep failing.`,
  },
  {
    title: 'Redis-backed rate limiting, not an in-memory counter',
    body: `An in-memory request counter only works correctly on a single instance.
    The moment this runs behind a load balancer with 2+ instances, each
    instance has its own counter and the real limit silently becomes
    capacity × instance_count. Redis's atomic INCR + EXPIRE keeps the
    limit correct regardless of how many app instances are running.`,
  },
  {
    title: 'Scheduled poller instead of a message queue (Kafka/SQS)',
    body: `A real production system would use a proper queue so retries survive an
    app restart and scale independently of the API layer. For a project this
    size, adding Kafka would be infra for infra's sake — it wouldn't
    demonstrate a different pattern, just more moving parts to run locally.
    The retry/backoff logic is written so the poller is a swappable detail:
    replacing @Scheduled with a queue consumer wouldn't touch DeliveryService's
    actual retry logic.`,
  },
];

const LAYERS = [
  { icon: '📤', label: 'Producer', detail: 'registers a subscription, publishes events' },
  { icon: '🌐', label: 'REST API', detail: 'EventController, SubscriptionController' },
  { icon: '🗄️', label: 'Persistence', detail: 'H2 (dev) / PostgreSQL-ready via JPA' },
  { icon: '⏱️', label: 'Retry scheduler', detail: '@Scheduled poller, 2s tick' },
  { icon: '⚙️', label: 'Worker', detail: '@Async dispatch, HMAC sign, HTTP POST' },
  { icon: '🔗', label: 'Subscriber', detail: 'verifies signature, dedupes by idempotency key' },
];

export function ArchitecturePage() {
  return (
    <div className="architecture-page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <h1>Architecture &amp; Design Decisions</h1>
      <p className="landing-subtitle">
        Built to demonstrate reliability and security patterns rather than to
        reinvent a production message broker.
      </p>

      <div className="layer-stack">
        {LAYERS.map((l, i) => (
          <div key={l.label}>
            <div className="layer-row">
              <span className="layer-icon">{l.icon}</span>
              <div className="layer-label">{l.label}</div>
              <div className="layer-detail">{l.detail}</div>
            </div>
            {i < LAYERS.length - 1 && <div className="layer-arrow">↓</div>}
          </div>
        ))}
      </div>

      <h2 className="decisions-heading">Why these choices</h2>
      <div className="decisions-list">
        {DECISIONS.map((d) => (
          <div key={d.title} className="decision-card">
            <h3>{d.title}</h3>
            <p>{d.body}</p>
          </div>
        ))}
      </div>

      <div className="stack-footer">
        <span className="stack-footer-label">Built with</span>
        <span>Java 17</span>
        <span>Spring Boot 3</span>
        <span>React</span>
        <span>Redis</span>
        <span>Spring Data JPA</span>
        <span>H2 / PostgreSQL</span>
        <span>Vite</span>
      </div>
    </div>
  );
}
