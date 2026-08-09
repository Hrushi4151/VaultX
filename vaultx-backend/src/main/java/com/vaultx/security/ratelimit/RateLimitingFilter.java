package com.vaultx.security.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaultx.common.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    // In-memory rate limiting counters (IP -> Token Bucket)
    private final Map<String, TokenBucket> authEndpointBuckets = new ConcurrentHashMap<>();
    private final Map<String, TokenBucket> generalEndpointBuckets = new ConcurrentHashMap<>();

    private static final int AUTH_LIMIT_PER_MINUTE = 10;
    private static final int GENERAL_LIMIT_PER_MINUTE = 150;

    private static class TokenBucket {
        private int tokens;
        private Instant lastRefill;

        public TokenBucket(int maxTokens) {
            this.tokens = maxTokens;
            this.lastRefill = Instant.now();
        }

        public synchronized boolean tryConsume(int maxTokens) {
            Instant now = Instant.now();
            long elapsedSeconds = now.getEpochSecond() - lastRefill.getEpochSecond();

            if (elapsedSeconds >= 60) {
                this.tokens = maxTokens;
                this.lastRefill = now;
            }

            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        boolean isAuthEndpoint = path.contains("/auth/login") || path.contains("/auth/register")
                || path.contains("/auth/send-otp") || path.contains("/auth/send-email-otp")
                || path.contains("/auth/send-mobile-otp") || path.contains("/auth/forgot-password");

        TokenBucket bucket;
        int maxLimit;

        if (isAuthEndpoint) {
            maxLimit = AUTH_LIMIT_PER_MINUTE;
            bucket = authEndpointBuckets.computeIfAbsent(clientIp, k -> new TokenBucket(maxLimit));
        } else {
            maxLimit = GENERAL_LIMIT_PER_MINUTE;
            bucket = generalEndpointBuckets.computeIfAbsent(clientIp, k -> new TokenBucket(maxLimit));
        }

        if (bucket.tryConsume(maxLimit)) {
            filterChain.doFilter(request, response);
            return;
        }

        log.warn("Rate limit exceeded for IP {} on path {}", clientIp, path);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiResponse<Void> apiResponse = ApiResponse.error("Rate limit exceeded. Please wait a minute before making more requests.", null);
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
