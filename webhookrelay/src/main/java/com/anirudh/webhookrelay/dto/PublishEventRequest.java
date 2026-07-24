package com.anirudh.webhookrelay.dto;

import jakarta.validation.constraints.NotBlank;

public class PublishEventRequest {

    @NotBlank
    private String eventType;

    @NotBlank
    private String payload; //raw JSON string the subscriber's system expects

    private String idempotencyKey;

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
