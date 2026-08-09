package com.vaultx.service;

import com.vaultx.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpCooldownService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String COOLDOWN_PREFIX = "otp:cooldown:";
    private static final long COOLDOWN_SECONDS = 60;

    private final Map<String, Instant> fallbackCooldownMap = new ConcurrentHashMap<>();

    public void checkAndSetCooldown(String target) {
        if (target == null || target.trim().isEmpty()) {
            return;
        }

        String normalizedTarget = target.trim().toLowerCase();
        String redisKey = COOLDOWN_PREFIX + normalizedTarget;

        try {
            Object lastReqVal = redisTemplate.opsForValue().get(redisKey);
            if (lastReqVal != null) {
                long lastEpoch = Long.parseLong(lastReqVal.toString());
                long elapsed = Instant.now().getEpochSecond() - lastEpoch;
                if (elapsed < COOLDOWN_SECONDS) {
                    long secondsLeft = COOLDOWN_SECONDS - elapsed;
                    throw new BusinessException("Please wait " + secondsLeft + " seconds before requesting a new OTP code.");
                }
            }
            redisTemplate.opsForValue().set(redisKey, String.valueOf(Instant.now().getEpochSecond()), Duration.ofSeconds(COOLDOWN_SECONDS));
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.warn("Redis cooldown check failed, falling back to memory map: {}", e.getMessage());
            Instant lastReq = fallbackCooldownMap.get(normalizedTarget);
            if (lastReq != null) {
                long elapsed = Instant.now().getEpochSecond() - lastReq.getEpochSecond();
                if (elapsed < COOLDOWN_SECONDS) {
                    long secondsLeft = COOLDOWN_SECONDS - elapsed;
                    throw new BusinessException("Please wait " + secondsLeft + " seconds before requesting a new OTP code.");
                }
            }
            fallbackCooldownMap.put(normalizedTarget, Instant.now());
        }
    }
}
