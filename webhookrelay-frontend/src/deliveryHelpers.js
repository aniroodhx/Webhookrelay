// Shared display helpers for delivery status, used by the table and drawer.

// Mirrors webhook.retry.max-attempts in application.properties — display only.
export const MAX_ATTEMPTS = 5;

export const STATUS_META = {
  PENDING: { label: '🟡 Retry scheduled', className: 'status-pending' },
  DELIVERED: { label: '🟢 Delivered', className: 'status-delivered' },
  FAILED: { label: '🔴 Failed', className: 'status-failed' },
  DEAD_LETTERED: { label: '⚫ Dead-lettered', className: 'status-dead' },
};

export function secondsUntil(isoTimestamp, now) {
  if (!isoTimestamp) return null;
  const diff = (new Date(isoTimestamp).getTime() - now) / 1000;
  return diff > 0 ? Math.ceil(diff) : 0;
}

// Just the codes this project's demo receiver and typical HTTP servers
// actually produce — not a full IANA status registry.
const STATUS_TEXT = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export function formatResponseCode(code) {
  if (code == null) return null;
  const text = STATUS_TEXT[code];
  return text ? `${code} ${text}` : String(code);
}

// Mirrors webhook.retry.base-delay-ms doubling in DeliveryService — display only.
export const BACKOFF_STAGES_SECONDS = [1, 2, 4, 8, 16];
