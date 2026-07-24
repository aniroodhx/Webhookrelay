// api.js — thin fetch wrapper around the WebhookRelay backend.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  baseUrl: BASE_URL,

  listSubscriptions: () => request('/api/subscriptions'),
  createSubscription: (sub) =>
    request('/api/subscriptions', { method: 'POST', body: JSON.stringify(sub) }),
  deactivateSubscription: (id) =>
    request(`/api/subscriptions/${id}`, { method: 'DELETE' }),

  // 202 = a newly created event; 200 = an existing event returned because
  // the idempotency key was already seen (duplicate publish, deduped).
  publishEvent: async (event) => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`);
    }
    const body = await res.json();
    return { event: body, wasDuplicate: res.status === 200 };
  },

  listDeliveries: () => request('/api/deliveries'),

  resetDemoScenario: (scenario) =>
    request(`/api/demo/receiver/${scenario}`, { method: 'DELETE' }),
};

export { BASE_URL };
