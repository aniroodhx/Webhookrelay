package com.anirudh.webhookrelay.repository;

import com.anirudh.webhookrelay.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    List<Subscription> findByEventTypeAndActiveTrue(String eventType);
}
