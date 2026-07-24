package com.anirudh.webhookrelay.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String targetUrl;

    // Secret used to HMAC-sign every payload delivered to this subscriber
    // In production this should be encrypted at rest, not stored plaintext
    @Column(nullable = false)
    private String signingSecret;

    @Column(nullable = false)
    private String eventType; // e.g. "resume.scored", "defect.created"

    private Instant createdAt = Instant.now();

    private boolean active = true;

    public Subscription() {}

    public Subscription(String targetUrl, String signingSecret, String eventType) {
        this.targetUrl = targetUrl;
        this.signingSecret = signingSecret;
        this.eventType = eventType;
    }

    public UUID getId() { return id; }
    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    public String getSigningSecret() { return signingSecret; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Instant getCreatedAt() { return createdAt; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
