package com.vaultx.security.csrf;

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
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class CsrfValidationFilter extends OncePerRequestFilter {

    private final RedisCsrfTokenRepository csrfTokenRepository;
    private final ObjectMapper objectMapper;

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");
    
    // Exempt initial authentication bootstrapping & public swagger docs from strict CSRF requirement
    private static final Set<String> EXEMPT_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/csrf",
            "/api/v1/auth/send-email-otp",
            "/api/v1/auth/verify-email-otp",
            "/api/v1/auth/send-mobile-otp",
            "/api/v1/auth/verify-mobile-otp",
            "/api/v1/auth/send-otp",
            "/api/v1/auth/verify-otp",
            "/api/v1/auth/refresh",
            "/api/v1/admin/auth/login"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String method = request.getMethod();
        String path = request.getRequestURI();

        // 1. Skip GET/OPTIONS/HEAD methods
        if (SAFE_METHODS.contains(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Skip exempt path endpoints
        if (isExemptPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extract CSRF token from header or request parameters
        String csrfToken = request.getHeader("X-CSRF-TOKEN");
        if (csrfToken == null || csrfToken.isEmpty()) {
            csrfToken = request.getHeader("X-XSRF-TOKEN");
        }

        String clientIp = getClientIp(request);

        // 4. Validate CSRF token against Redis/Fallback store
        if (csrfToken != null && csrfTokenRepository.validateToken(clientIp, csrfToken)) {
            filterChain.doFilter(request, response);
            return;
        }

        // If CSRF header is present but empty or invalid, return 403 Forbidden
        log.warn("CSRF validation failed for client IP {} on {} {}", clientIp, method, path);

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiResponse<Void> apiResponse = ApiResponse.error("CSRF token validation failed. Please refresh your CSRF token.", null);
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }

    private boolean isExemptPath(String path) {
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") || path.startsWith("/actuator")) {
            return true;
        }
        return EXEMPT_PATHS.contains(path);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
