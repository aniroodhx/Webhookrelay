# WebhookRelay

A reliable webhook delivery system — modeled after how Stripe and Razorpay guarantee
event delivery to third-party endpoints — built to demonstrate reliability and
security patterns rather than to reinvent a production message broker.

## What it does

1. A producer registers a **subscription**: "send events of type X to this URL."
2. A producer **publishes an event** of type X.
3. WebhookRelay delivers the event to every active subscriber, signed and
   retried until it succeeds or is dead-lettered.

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

Java 17, Spring Boot 3, Spring Data JPA, H2 (dev) / PostgreSQL-ready, Redis
(rate limiting), Spring `@Async` + `@Scheduled` (retry worker).

## Running locally

```bash
# Redis required for rate limiting — skip if you comment out the RateLimiter check
docker run -d -p 6379:6379 redis:7

mvn spring-boot:run
```

## API

```
POST   /api/subscriptions        register a subscriber
GET    /api/subscriptions        list subscribers
DELETE /api/subscriptions/{id}   deactivate a subscriber

POST   /api/events                publish an event (fans out to matching subscribers)

GET    /api/deliveries            list all delivery attempts + status
GET    /api/deliveries/{id}       check one delivery's status/attempt history
```
