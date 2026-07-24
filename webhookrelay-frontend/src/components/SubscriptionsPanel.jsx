import { useState } from 'react';
import { api } from '../api';

const DEMO_SCENARIOS = [
  { label: 'Always succeeds', failTimes: 0 },
  { label: 'Fails twice, then succeeds', failTimes: 2 },
  { label: 'Fails until dead-lettered', failTimes: 99 },
];

// Builds a targetUrl pointing at the backend's own demo receiver, so a
// subscription can be created without standing up a real external service.
function demoTargetUrl(scenarioId, failTimes) {
  return `${api.baseUrl}/api/demo/receiver/${scenarioId}?failTimes=${failTimes}`;
}

export function SubscriptionsPanel({ subscriptions, onChanged }) {
  const [eventType, setEventType] = useState('order.created');
  const [mode, setMode] = useState('demo'); // 'demo' | 'custom'
  const [scenarioIndex, setScenarioIndex] = useState(1);
  const [customUrl, setCustomUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const targetUrl =
        mode === 'demo'
          ? demoTargetUrl(
              `scenario-${Date.now()}`,
              DEMO_SCENARIOS[scenarioIndex].failTimes
            )
          : customUrl;

      await api.createSubscription({ targetUrl, eventType });
      setCustomUrl('');
      onChanged();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    await api.deactivateSubscription(id);
    onChanged();
  };

  return (
    <section className="panel">
      <h2>Subscriptions</h2>
      <p className="panel-hint">
        A subscription says "send events of this type to this URL." Point it at
        one of the built-in demo scenarios to see retries without running a
        real receiver.
      </p>

      <form onSubmit={handleCreate} className="form-grid">
        <label>
          Event type
          <input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="order.created"
            required
          />
        </label>

        <fieldset className="mode-toggle">
          <label>
            <input
              type="radio"
              checked={mode === 'demo'}
              onChange={() => setMode('demo')}
            />
            Demo receiver
          </label>
          <label>
            <input
              type="radio"
              checked={mode === 'custom'}
              onChange={() => setMode('custom')}
            />
            Custom URL
          </label>
        </fieldset>

        {mode === 'demo' ? (
          <label>
            Scenario
            <select
              value={scenarioIndex}
              onChange={(e) => setScenarioIndex(Number(e.target.value))}
            >
              {DEMO_SCENARIOS.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Target URL
            <input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/webhooks"
              required
            />
          </label>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create subscription'}
        </button>
      </form>

      {errorMsg && <p className="error-text">{errorMsg}</p>}

      <ul className="subscription-list">
        {subscriptions.length === 0 && (
          <li className="empty-state">No subscriptions yet.</li>
        )}
        {subscriptions.map((sub) => (
          <li key={sub.id} className={sub.active ? '' : 'inactive'}>
            <div className="subscription-row">
              <span className="badge">{sub.eventType}</span>
              <code className="target-url" title={sub.targetUrl}>
                {sub.targetUrl}
              </code>
            </div>
            {sub.active && (
              <button
                className="link-button"
                onClick={() => handleDeactivate(sub.id)}
              >
                deactivate
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
