package com.anirudh.webhookrelay.controller;

import com.anirudh.webhookrelay.dto.SubscriptionRequest;
import com.anirudh.webhookrelay.model.Subscription;
import com.anirudh.webhookrelay.repository.SubscriptionRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionRepository subscriptionRepository;

    public SubscriptionController(SubscriptionRepository subscriptionRepository) {
        this.subscriptionRepository = subscriptionRepository;
    }

    @PostMapping
    public ResponseEntity<Subscription> register(@Valid @RequestBody SubscriptionRequest req) {
        String secret = (req.getSigningSecret() != null && !req.getSigningSecret().isBlank())
                ? req.getSigningSecret()
                : UUID.randomUUID().toString().replace("-", "");

        Subscription sub = new Subscription(req.getTargetUrl(), secret, req.getEventType());
        Subscription saved = subscriptionRepository.save(sub);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public List<Subscription> list() {
        return subscriptionRepository.findAll();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        return subscriptionRepository.findById(id)
                .map(sub -> {
                    sub.setActive(false);
                    subscriptionRepository.save(sub);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
