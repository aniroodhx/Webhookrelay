package com.anirudh.webhookrelay.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/demo/receiver")
public class DemoReceiverController {

    private final Map<String, AtomicInteger> attemptCounts = new ConcurrentHashMap<>();

    @PostMapping("/{scenario}")
    public ResponseEntity<Map<String, Object>> receive(
            @PathVariable String scenario,
            @RequestParam(defaultValue = "0") int failTimes,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

        int attempt = attemptCounts.computeIfAbsent(scenario, k -> new AtomicInteger(0))
                .incrementAndGet();

        boolean shouldFail = attempt <= failTimes;

        Map<String, Object> body = Map.of(
                "scenario", scenario,
                "attempt", attempt,
                "ok", !shouldFail,
                "signaturePresent", signature != null && !signature.isBlank(),
                "idempotencyKey", idempotencyKey == null ? "" : idempotencyKey
        );

        return shouldFail
                ? ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body)
                : ResponseEntity.ok(body);
    }

    /** Lets the UI reset a scenario's counter before re-running a demo. */
    @DeleteMapping("/{scenario}")
    public ResponseEntity<Void> reset(@PathVariable String scenario) {
        attemptCounts.remove(scenario);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{scenario}")
    public ResponseEntity<Map<String, Object>> count(@PathVariable String scenario) {
        int count = attemptCounts.getOrDefault(scenario, new AtomicInteger(0)).get();
        return ResponseEntity.ok(Map.of("scenario", scenario, "attempts", count));
    }
}
