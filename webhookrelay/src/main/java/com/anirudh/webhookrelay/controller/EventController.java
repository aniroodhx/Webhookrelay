package com.anirudh.webhookrelay.controller;

import com.anirudh.webhookrelay.dto.PublishEventRequest;
import com.anirudh.webhookrelay.model.Subscription;
import com.anirudh.webhookrelay.model.WebhookEvent;
import com.anirudh.webhookrelay.repository.SubscriptionRepository;
import com.anirudh.webhookrelay.repository.WebhookEventRepository;
import com.anirudh.webhookrelay.security.RateLimiter;
import com.anirudh.webhookrelay.service.DeliveryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final WebhookEventRepository eventRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final DeliveryService deliveryService;
    private final RateLimiter rateLimiter;

    public EventController(WebhookEventRepository eventRepository,
                            SubscriptionRepository subscriptionRepository,
                            DeliveryService deliveryService,
                            RateLimiter rateLimiter) {
        this.eventRepository = eventRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.deliveryService = deliveryService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping
    public ResponseEntity<?> publish(@Valid @RequestBody PublishEventRequest req, HttpServletRequest httpReq) {
        //Rate limit keyed by client IP for this demo; in production this would be keyed by API key so limits are per-tenant, not per-IP (which breaks down behind NATs/proxies).
        String rateLimitKey = httpReq.getRemoteAddr();
        if (!rateLimiter.allow(rateLimitKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("{\"error\":\"rate limit exceeded, try again shortly\"}");
        }

        String idempotencyKey = (req.getIdempotencyKey() != null && !req.getIdempotencyKey().isBlank())
                ? req.getIdempotencyKey()
                : UUID.randomUUID().toString();

        //if this exact idempotency key was already published, return the existing event instead of creating a duplicate — this is what protects a producer that retries its own publish call after a timeout from fanning the same event out twice.
        var existing = eventRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.OK).body(existing.get());
        }

        WebhookEvent event = new WebhookEvent(idempotencyKey, req.getEventType(), req.getPayload());
        WebhookEvent savedEvent = eventRepository.save(event);

        List<Subscription> subscribers = subscriptionRepository
                .findByEventTypeAndActiveTrue(req.getEventType());

        subscribers.forEach(sub -> deliveryService.scheduleInitialDelivery(savedEvent, sub));

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(savedEvent);
    }
}
