package com.anirudh.webhookrelay.dto;

import jakarta.validation.constraints.NotBlank;

public class SubscriptionRequest {

    @NotBlank
    private String targetUrl;

    @NotBlank
    private String eventType;

    // optional, if not provided, we generate one and return it once
    private String signingSecret;

    public String getTargetUrl() { return targetUrl; }
    public void setTargetUrl(String targetUrl) { this.targetUrl = targetUrl; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getSigningSecret() { return signingSecret; }
    public void setSigningSecret(String signingSecret) { this.signingSecret = signingSecret; }
}
