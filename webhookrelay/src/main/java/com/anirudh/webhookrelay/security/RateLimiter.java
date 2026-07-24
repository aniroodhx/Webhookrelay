package com.anirudh.webhookrelay.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Simple fixed-window token bucket rate limiter backed by Redis.
 *
 * Each caller (keyed by API key or IP) gets a bucket that refills once per
 * window. Redis's atomic INCR + EXPIRE means this works correctly even with
 * multiple app instances behind a load balancer, which an in-memory
 * counter would not.
 */
@Component
public class RateLimiter {

    private final StringRedisTemplate redisTemplate;

    @Value("${webhook.ratelimit.capacity:20}")
    private int capacity;

    public RateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * @return true if the request is allowed, false if the caller has
     *         exceeded their quota for the current 60-second window.
     */
    public boolean allow(String key) {
        String redisKey = "ratelimit:" + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);
        if (count != null && count == 1L) {
            // first request in this window — start the 60s TTL
            redisTemplate.expire(redisKey, Duration.ofSeconds(60));
        }
        return count != null && count <= capacity;
    }
}
