package com.anirudh.webhookrelay.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webhook_events")
public class WebhookEvent {

    @Id
    @GeneratedValue
    private UUID id;

    //Idempotency key: lets a subscriber safely dedupe if they receive the same event twice (e.g. after a retry succeeded server-side but the ack was lost). Producer can pass their own key; we default to this event's UUID if none given.
    @Column(nullable = false, unique = true)
    private String idempotencyKey;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false, columnDefinition = "text")
    private String payload; // JSON string

    private Instant createdAt = Instant.now();

    public WebhookEvent() {}

    public WebhookEvent(String idempotencyKey, String eventType, String payload) {
        this.idempotencyKey = idempotencyKey;
        this.eventType = eventType;
        this.payload = payload;
    }

    public UUID getId() { return id; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public Instant getCreatedAt() { return createdAt; }
}