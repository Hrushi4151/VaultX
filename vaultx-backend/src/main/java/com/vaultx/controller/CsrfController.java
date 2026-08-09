package com.vaultx.controller;

import com.vaultx.common.ApiResponse;
import com.vaultx.security.csrf.RedisCsrfTokenRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth/csrf")
@RequiredArgsConstructor
@Tag(name = "CSRF Security", description = "Endpoints for CSRF token acquisition")
public class CsrfController {

    private final RedisCsrfTokenRepository csrfTokenRepository;

    @GetMapping
    @Operation(summary = "Get a new anti-CSRF token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCsrfToken(
            HttpServletRequest request,
            HttpServletResponse response) {

        String clientIp = getClientIp(request);
        String csrfToken = csrfTokenRepository.generateToken(clientIp);

        // Set XSRF-TOKEN cookie
        Cookie cookie = new Cookie("XSRF-TOKEN", csrfToken);
        cookie.setPath("/");
        cookie.setHttpOnly(false);
        cookie.setMaxAge(86400); // 24 hours
        response.addCookie(cookie);

        Map<String, String> responseData = Map.of(
                "csrfToken", csrfToken,
                "headerName", "X-CSRF-TOKEN"
        );

        return ResponseEntity.ok(ApiResponse.success("CSRF token generated successfully", responseData));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
