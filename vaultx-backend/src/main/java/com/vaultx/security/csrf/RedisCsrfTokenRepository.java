package com.vaultx.security.csrf;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisCsrfTokenRepository {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String CSRF_PREFIX = "csrf:token:";
    private static final Duration TOKEN_TTL = Duration.ofHours(24);

    // Resilient fallback memory map if Redis connection fails or is unavailable
    private final Map<String, String> fallbackTokenMap = new ConcurrentHashMap<>();

    public String generateToken(String clientKey) {
        String token = UUID.randomUUID().toString().replace("-", "");
        String redisKey = CSRF_PREFIX + clientKey;

        try {
            redisTemplate.opsForValue().set(redisKey, token, TOKEN_TTL);
        } catch (Exception e) {
            log.warn("Redis unavailable for CSRF token storage, using memory fallback: {}", e.getMessage());
            fallbackTokenMap.put(redisKey, token);
        }
        return token;
    }

    public boolean validateToken(String clientKey, String token) {
        if (clientKey == null || token == null || token.trim().isEmpty()) {
            return false;
        }

        String redisKey = CSRF_PREFIX + clientKey;
        String storedToken = null;

        try {
            Object value = redisTemplate.opsForValue().get(redisKey);
            if (value != null) {
                storedToken = value.toString();
            }
        } catch (Exception e) {
            log.warn("Redis read error for CSRF token, checking fallback: {}", e.getMessage());
            storedToken = fallbackTokenMap.get(redisKey);
        }

        return token.equals(storedToken);
    }

    public void removeToken(String clientKey) {
        if (clientKey == null) return;
        String redisKey = CSRF_PREFIX + clientKey;
        try {
            redisTemplate.delete(redisKey);
        } catch (Exception ignored) {}
        fallbackTokenMap.remove(redisKey);
    }
}
