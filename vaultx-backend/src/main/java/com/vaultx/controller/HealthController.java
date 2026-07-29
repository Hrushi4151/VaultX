package com.vaultx.controller;

import com.vaultx.common.ApiResponse;
import com.vaultx.common.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Public health-check endpoint providing basic application status and uptime.
 */
@RestController
@RequestMapping(AppConstants.API_V1 + "/health")
@Tag(name = "Health", description = "Application health and status")
@Slf4j
public class HealthController {

    @Value("${spring.application.name:vaultx-backend}")
    private String applicationName;

    @Value("${vaultx.app.version:1.0.0}")
    private String applicationVersion;

    @GetMapping
    @Operation(
            summary = "Application health check",
            description = "Returns application name, version, status, and uptime. No authentication required."
    )
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
        long uptimeSeconds = uptimeMillis / 1000;

        Map<String, Object> healthData = Map.of(
                "application", applicationName,
                "version", applicationVersion,
                "status", "UP",
                "timestamp", LocalDateTime.now().toString(),
                "uptimeSeconds", uptimeSeconds,
                "uptimeFormatted", formatUptime(uptimeSeconds)
        );

        log.debug("Health check requested — uptime: {}s", uptimeSeconds);
        return ResponseEntity.ok(ApiResponse.success("Application is healthy", healthData));
    }

    private String formatUptime(long totalSeconds) {
        long hours = totalSeconds / 3600;
        long minutes = (totalSeconds % 3600) / 60;
        long seconds = totalSeconds % 60;
        return String.format("%dh %dm %ds", hours, minutes, seconds);
    }
}
