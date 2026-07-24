package com.anirudh.webhookrelay.controller;

import com.anirudh.webhookrelay.model.DeliveryAttempt;
import com.anirudh.webhookrelay.repository.DeliveryAttemptRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryStatusController {

    private final DeliveryAttemptRepository deliveryAttemptRepository;

    public DeliveryStatusController(DeliveryAttemptRepository deliveryAttemptRepository) {
        this.deliveryAttemptRepository = deliveryAttemptRepository;
    }

    /** Lets a subscriber (or an internal dashboard) check delivery status/history for an event. */
    @GetMapping
    public List<DeliveryStatusView> list() {
        return deliveryAttemptRepository.findAll().stream()
                .map(DeliveryStatusView::from)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeliveryStatusView> get(@PathVariable UUID id) {
        return deliveryAttemptRepository.findById(id)
                .map(a -> ResponseEntity.ok(DeliveryStatusView.from(a)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** Flat projection so we don't leak JPA entity/lazy-loading details over the wire. */
    public record DeliveryStatusView(
            UUID id,
            UUID eventId,
            String eventType,
            UUID subscriptionId,
            String targetUrl,
            String status,
            int attemptCount,
            Integer lastResponseCode,
            long lastLatencyMs,
            Instant lastAttemptAt,
            Instant nextAttemptAt
    ) {
        static DeliveryStatusView from(DeliveryAttempt a) {
            return new DeliveryStatusView(
                    a.getId(),
                    a.getEvent().getId(),
                    a.getEvent().getEventType(),
                    a.getSubscription().getId(),
                    a.getSubscription().getTargetUrl(),
                    a.getStatus().name(),
                    a.getAttemptCount(),
                    a.getLastResponseCode(),
                    a.getLastLatencyMs(),
                    a.getLastAttemptAt(),
                    a.getStatus() == DeliveryAttempt.Status.PENDING ? a.getNextAttemptAt() : null
            );
        }
    }
}
