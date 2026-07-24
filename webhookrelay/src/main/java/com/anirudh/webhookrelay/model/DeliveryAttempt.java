package com.anirudh.webhookrelay.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "delivery_attempts")
public class DeliveryAttempt {

    public enum Status { PENDING, DELIVERED, FAILED, DEAD_LETTERED }

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private WebhookEvent event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    private int attemptCount = 0;

    private Integer lastResponseCode;

    private Instant nextAttemptAt = Instant.now();

    private Instant lastAttemptAt;

    private long lastLatencyMs;

    public DeliveryAttempt() {}

    public DeliveryAttempt(WebhookEvent event, Subscription subscription) {
        this.event = event;
        this.subscription = subscription;
    }

    public UUID getId() { return id; }
    public WebhookEvent getEvent() { return event; }
    public Subscription getSubscription() { return subscription; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public int getAttemptCount() { return attemptCount; }
    public void incrementAttempt() { this.attemptCount++; }
    public Integer getLastResponseCode() { return lastResponseCode; }
    public void setLastResponseCode(Integer c) { this.lastResponseCode = c; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public void setNextAttemptAt(Instant t) { this.nextAttemptAt = t; }
    public Instant getLastAttemptAt() { return lastAttemptAt; }
    public void setLastAttemptAt(Instant t) { this.lastAttemptAt = t; }
    public long getLastLatencyMs() { return lastLatencyMs; }
    public void setLastLatencyMs(long ms) { this.lastLatencyMs = ms; }
}
