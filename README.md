# WebhookRelay

Reliable webhook delivery infrastructure — modeled after how Stripe and
Razorpay guarantee event delivery to third-party endpoints — with a live
dashboard for watching deliveries, retries, and failures happen in real time.

**[Live Demo](#)** · Backend: `webhookrelay/` · Frontend: `webhookrelay-frontend/`

## What it does

1. A producer registers a **subscription** — "send events of type X to this URL."
2. A producer **publishes an event** of type X.
3. WebhookRelay delivers it to every matching subscriber: signed with
   HMAC-SHA256, retried with exponential backoff on failure, and
   dead-lettered after repeated failures instead of retrying forever.

The dashboard shows this play out live: publish an event and watch a
delivery move through `PENDING → retry (backing off) → DELIVERED`, or fail
five times and land in `DEAD_LETTERED`.

## Architecture

```
Producer
   │
   ▼
REST API (register subscription / publish event)
   │
   ▼
Postgres (events, subscriptions, delivery attempts)
   │
   ▼
Scheduled poller picks up due deliveries
   │
   ▼
Worker signs payload (HMAC-SHA256) → POST to subscriber
   │
   ├─ success → DELIVERED
   └─ failure → exponential backoff → retry (up to 5x) → DEAD_LETTERED
```

## Design decisions (and why)

**Exponential backoff over fixed-interval retry.**
A failing endpoint is often failing because it's overloaded — hammering it
every second makes that worse. Backoff (1s → 2s → 4s → 8s → 16s, capped at
5 attempts) gives a struggling endpoint room to recover, and caps total
retry cost instead of retrying forever.

**HMAC-SHA256 signing, not just HTTPS.**
HTTPS proves the transport is encrypted; it doesn't prove *we* sent the
payload versus someone who guessed the subscriber's URL. Every delivery is
signed with a per-subscription secret, verified via constant-time
comparison (`MessageDigest.isEqual`) to avoid leaking timing information
that could help an attacker brute-force the signature.

**Idempotency keys on publish, not just delivery.**
Retry logic on the *delivery* side is the obvious half of this problem.
The less obvious half: what if the *producer* retries their own publish
call after a timeout, not realizing it actually succeeded? Without an
idempotency key, that creates a duplicate event and double-delivers to
every subscriber. Deduping on publish closes that gap.

**Dead-lettering instead of infinite retry.**
After 5 failed attempts, a delivery moves to `DEAD_LETTERED` rather than
retrying forever. An endpoint that's been down for 5 exponentially-spaced
attempts needs a human to look at it, not a background thread quietly
burning resources on a call that will keep failing.

**Redis-backed rate limiting, not an in-memory counter.**
An in-memory request counter only works correctly on a single instance.
The moment this runs behind a load balancer with 2+ instances, each
instance has its own counter and the real limit silently becomes
`capacity × instance_count`. Redis's atomic `INCR` + `EXPIRE` keeps the
limit correct regardless of how many app instances are running.

**Scheduled poller instead of a message queue (Kafka/SQS).**
A real production system would use a proper queue so retries survive an
app restart and scale independently of the API layer. For a project this
size, adding Kafka would be infra for infra's sake — it wouldn't
demonstrate a different *pattern*, just more moving parts to run locally.
The retry/backoff logic here is written so the poller is a swappable
detail: replacing `@Scheduled` with a queue consumer wouldn't touch
`DeliveryService`'s actual retry logic.

## Stack

**Backend:** Java 17, Spring Boot 3, Spring Data JPA, H2 (dev) / PostgreSQL
(prod), Redis (rate limiting), Spring `@Async` + `@Scheduled` (retry worker).

**Frontend:** React 19, Vite, React Router.

**Deployment:** Vercel (frontend), Railway or Render (backend), Railway
PostgreSQL, Upstash or Railway Redis.

## API

```
POST   /api/subscriptions        register a subscriber
GET    /api/subscriptions        list subscribers
DELETE /api/subscriptions/{id}   deactivate a subscriber

POST   /api/events                publish an event (fans out to matching subscribers)

GET    /api/deliveries            list all delivery attempts + status
GET    /api/deliveries/{id}       check one delivery's status/attempt history
```

## Running locally

```bash
# Backend
cd webhookrelay
docker run -d -p 6379:6379 redis:7   # required for rate limiting
mvn spring-boot:run                    # API on http://localhost:8080

# Frontend (separate terminal)
cd webhookrelay-frontend
npm install
npm run dev                            # UI on http://localhost:5173
```

The frontend expects the backend at `http://localhost:8080` by default —
override with a `VITE_API_BASE_URL` env var if your backend runs elsewhere
(e.g. pointing a local frontend at a deployed backend).

If Redis isn't available locally, set `webhook.ratelimit.enabled=false` in
`application.properties` to run without it — every other feature (retries,
signing, idempotency, dead-lettering) works independently of Redis.

## Deployment

- **Frontend** → Vercel, Root Directory: `webhookrelay-frontend`, env var `VITE_API_BASE_URL` set to the deployed backend URL
- **Backend** → Railway or Render, Root Directory: `webhookrelay`
- **Database** → Railway PostgreSQL (auto-generates connection env vars)
- **Redis** → Upstash or Railway Redis

Both Vercel and Railway/Render support deploying a single subdirectory out
of a monorepo, so this stays one GitHub repo instead of two disconnected ones.
