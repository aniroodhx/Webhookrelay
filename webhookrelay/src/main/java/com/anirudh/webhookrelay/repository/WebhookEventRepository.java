package com.anirudh.webhookrelay.repository;

import com.anirudh.webhookrelay.model.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, UUID> {
    Optional<WebhookEvent> findByIdempotencyKey(String idempotencyKey);
}
