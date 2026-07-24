import { Link } from 'react-router-dom';

const FEATURES = [
  'At-least-once delivery',
  'Exponential backoff retries',
  'HMAC-SHA256 signing',
  'Idempotent publish',
  'Distributed rate limiting',
  'Dead-lettering after max attempts',
];

const FLOW_STEPS = [
  'Publisher',
  'POST /api/events',
  'Persist event',
  'Fan out to subscribers',
  'Retry scheduler (backoff)',
  'Worker dispatch',
  'Subscriber',
  'Delivered',
];

const SCENARIOS = [
  {
    emoji: '🟢',
    tag: 'Success',
    title: 'Always succeeds',
    steps: ['Publish', '200', 'Delivered'],
    how: 'Create a subscription on the "Always succeeds" scenario, then publish an event of the same type.',
  },
  {
    emoji: '🟡',
    tag: 'Retry Demo',
    title: 'Fails twice, then succeeds',
    steps: ['Publish', '503', 'Retry', '503', 'Retry', '200 · Delivered'],
    how: 'Pick "Fails twice, then succeeds" and watch the Deliveries page — status goes Retry scheduled → Retry scheduled → Delivered, backing off 1s then 2s.',
  },
  {
    emoji: '🔴',
    tag: 'DLQ Demo',
    title: 'Fails until dead-lettered',
    steps: ['Publish', 'Retry ×5', 'Dead-lettered'],
    how: 'Pick "Fails until dead-lettered" — the same subscriber never returns 200, so after 5 exponentially-spaced attempts it stops retrying automatically.',
  },
  {
    emoji: '🔒',
    tag: 'Idempotency',
    title: 'Duplicate publish',
    steps: ['Publish (key: X)', 'Accepted · 202', 'Publish again (key: X)', 'Duplicate · Skipped · 200'],
    how: 'On Publish Event, set an idempotency key and publish. Publish the exact same key again — the toast will say "Duplicate detected" instead of creating a second event.',
  },
];

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <div className="landing-badge">
          <span className="dot" />
          WebhookRelay
        </div>
        <h1>Reliable Webhook Delivery Infrastructure</h1>
        <p className="landing-subtitle">
          Reliable webhook delivery with automatic retries, cryptographic
          request signing, and idempotent event processing.
        </p>

        <ul className="feature-checklist">
          {FEATURES.map((f) => (
            <li key={f}>
              <span className="check">✓</span> {f}
            </li>
          ))}
        </ul>

        <div className="landing-ctas">
          <Link to="/app/dashboard" className="cta-primary">
            Launch Dashboard
          </Link>
          {/* GitHub link intentionally omitted until this is pushed to a
              real repo — a dead link is worse than no link. */}
          <Link to="/architecture" className="cta-link">
            Architecture
          </Link>
        </div>
      </header>

      <section className="landing-flow">
        <h2>How an event moves through the system</h2>
        <div className="flow-diagram">
          {FLOW_STEPS.map((step, i) => (
            <div key={step} className="flow-step-wrapper">
              <div className="flow-step">{step}</div>
              {i < FLOW_STEPS.length - 1 && <div className="flow-arrow">↓</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-scenarios">
        <h2>Demo scenarios — click these in the dashboard</h2>
        <p className="landing-subtitle scenarios-lead">
          Each one is a real subscription pointed at the built-in demo
          receiver — nothing here is faked after the fact.
        </p>
        <div className="scenario-grid">
          {SCENARIOS.map((s) => (
            <div key={s.title} className="scenario-card">
              <div className="scenario-tag">
                {s.emoji} {s.tag}
              </div>
              <h3>{s.title}</h3>
              <div className="scenario-steps">
                {s.steps.map((step, i) => (
                  <span key={i} className="scenario-step-wrapper">
                    <span className="scenario-step">{step}</span>
                    {i < s.steps.length - 1 && (
                      <span className="scenario-arrow">→</span>
                    )}
                  </span>
                ))}
              </div>
              <p className="scenario-how">{s.how}</p>
            </div>
          ))}
        </div>
        <div className="landing-ctas scenarios-cta">
          <Link to="/app/subscriptions" className="cta-primary">
            Try it — open Subscriptions
          </Link>
        </div>
      </section>
    </div>
  );
}
