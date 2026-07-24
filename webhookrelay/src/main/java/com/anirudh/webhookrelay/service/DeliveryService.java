package com.anirudh.webhookrelay.service;

import com.anirudh.webhookrelay.model.DeliveryAttempt;
import com.anirudh.webhookrelay.model.Subscription;
import com.anirudh.webhookrelay.model.WebhookEvent;
import com.anirudh.webhookrelay.repository.DeliveryAttemptRepository;
import com.anirudh.webhookrelay.security.HmacSigner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Handles actual HTTP delivery to subscriber endpoints, including:
 *  - HMAC signing of every outgoing payload
 *  - exponential backoff retry on failure
 *  - dead-lettering after max attempts, instead of retrying forever
 *
 * The retry worker (pollAndDeliverDueAttempts) is a @Scheduled poller rather
 * than a real message queue (Kafka/SQS) — deliberately, since a resume-sized
 * project doesn't need that infra to demonstrate the reliability pattern,
 * and an in-process poller keeps the whole thing runnable with just
 * `mvn spring-boot:run`. Swapping the poller for a real queue consumer later
 * wouldn't require touching the retry/backoff logic itself.
 */
@Service
public class DeliveryService {

    private final DeliveryAttemptRepository deliveryAttemptRepository;
    private final HmacSigner hmacSigner;
    private final RestTemplate restTemplate;

    @Value("${webhook.retry.max-attempts:5}")
    private int maxAttempts;

    @Value("${webhook.retry.base-delay-ms:1000}")
    private long baseDelayMs;

    public DeliveryService(DeliveryAttemptRepository deliveryAttemptRepository,
                            HmacSigner hmacSigner,
                            RestTemplate restTemplate) {
        this.deliveryAttemptRepository = deliveryAttemptRepository;
        this.hmacSigner = hmacSigner;
        this.restTemplate = restTemplate;
    }

    /** Creates the initial delivery attempt row when an event is first published. */
    public DeliveryAttempt scheduleInitialDelivery(WebhookEvent event, Subscription subscription) {
        DeliveryAttempt attempt = new DeliveryAttempt(event, subscription);
        attempt.setNextAttemptAt(Instant.now());
        return deliveryAttemptRepository.save(attempt);
    }

    /**
     * Runs every 2s and picks up any PENDING attempt whose nextAttemptAt has
     * arrived. Each is dispatched asynchronously so one slow subscriber can't
     * block delivery to everyone else.
     */
    @Scheduled(fixedDelay = 2000)
    public void pollAndDeliverDueAttempts() {
        List<DeliveryAttempt> due = deliveryAttemptRepository.findDueForDelivery(Instant.now());
        for (DeliveryAttempt attempt : due) {
            dispatch(attempt);
        }
    }

    @Async
    public void dispatch(DeliveryAttempt attempt) {
        Subscription sub = attempt.getSubscription();
        WebhookEvent event = attempt.getEvent();
        String payload = event.getPayload();
        String signature = hmacSigner.sign(payload, sub.getSigningSecret());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("X-Webhook-Signature", signature);
        headers.set("X-Webhook-Id", event.getId().toString());
        headers.set("X-Idempotency-Key", event.getIdempotencyKey());

        HttpEntity<String> request = new HttpEntity<>(payload, headers);

        attempt.incrementAttempt();
        attempt.setLastAttemptAt(Instant.now());
        long start = System.currentTimeMillis();

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(sub.getTargetUrl(), request, String.class);
            attempt.setLastLatencyMs(System.currentTimeMillis() - start);
            attempt.setLastResponseCode(response.getStatusCode().value());
            attempt.setStatus(DeliveryAttempt.Status.DELIVERED);
        } catch (HttpStatusCodeException e) {
            // RestTemplate throws (rather than returning) on any 4xx/5xx response,
            // so this is the branch that actually runs for a subscriber returning
            // an error — the response code is still worth recording for the dashboard.
            attempt.setLastLatencyMs(System.currentTimeMillis() - start);
            attempt.setLastResponseCode(e.getStatusCode().value());
            handleFailure(attempt);
        } catch (RestClientException e) {
            attempt.setLastLatencyMs(System.currentTimeMillis() - start);
            attempt.setLastResponseCode(null); // network-level failure, no HTTP response at all
            handleFailure(attempt);
        }

        deliveryAttemptRepository.save(attempt);
    }

    /**
     * Exponential backoff: delay doubles each attempt (1s, 2s, 4s, 8s, 16s...)
     * capped by maxAttempts, after which the attempt is dead-lettered rather
     * than retried indefinitely — an endpoint that's been down for 5 attempts
     * needs human attention, not infinite silent retries eating resources.
     */
    private void handleFailure(DeliveryAttempt attempt) {
        if (attempt.getAttemptCount() >= maxAttempts) {
            attempt.setStatus(DeliveryAttempt.Status.DEAD_LETTERED);
            return;
        }
        long delayMs = baseDelayMs * (1L << (attempt.getAttemptCount() - 1)); // baseDelay * 2^(n-1)
        attempt.setNextAttemptAt(Instant.now().plus(Duration.ofMillis(delayMs)));
        attempt.setStatus(DeliveryAttempt.Status.PENDING);
    }
}
