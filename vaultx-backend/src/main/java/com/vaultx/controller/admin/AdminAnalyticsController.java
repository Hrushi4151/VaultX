package com.vaultx.controller.admin;

import com.vaultx.common.ApiResponse;
import com.vaultx.dto.admin.AdminDashboardStatsDto;
import com.vaultx.entity.SecurityLog;
import com.vaultx.repository.SecurityLogRepository;
import com.vaultx.service.AdminAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Admin Analytics", description = "Enterprise admin portal statistics")
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final SecurityLogRepository securityLogRepository;

    @GetMapping("/dashboard")
    @Operation(summary = "Get global dashboard statistics for charts")
    public ResponseEntity<AdminDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminAnalyticsService.getDashboardStats());
    }

    @GetMapping("/audit-logs")
    @Transactional(readOnly = true)
    @Operation(summary = "Get recent security audit logs (last 100 events)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAuditLogs() {
        List<SecurityLog> logs = securityLogRepository.findTop100ByOrderByCreatedAtDesc();

        List<Map<String, Object>> result = logs.stream().map(log -> {
            String email = "system";
            String name = "System";
            if (log.getUser() != null) {
                email = log.getUser().getEmail() != null ? log.getUser().getEmail() : "unknown";
                name = log.getUser().getFirstName() != null
                        ? log.getUser().getFirstName() + " " + (log.getUser().getLastName() != null ? log.getUser().getLastName() : "")
                        : email;
            }

            String action = log.getAction() != null ? log.getAction().name() : "UNKNOWN";
            String level = switch (action) {
                case "LOGIN" -> "INFO";
                case "LOGOUT" -> "INFO";
                case "PASSWORD_CHANGED", "PIN_CHANGED" -> "WARN";
                default -> "INFO";
            };

            String desc = switch (action) {
                case "LOGIN" -> "User logged in successfully";
                case "LOGOUT" -> "User session ended";
                case "PASSWORD_CHANGED" -> "Account password was changed";
                case "EMAIL_VERIFIED" -> "Email address verified";
                case "PHONE_VERIFIED" -> "Phone number verified";
                case "PIN_CHANGED" -> "Vault PIN was updated";
                case "PROFILE_UPDATED" -> "Profile information updated";
                default -> "Security event recorded";
            };

            return Map.<String, Object>of(
                    "id", log.getId().toString(),
                    "timestamp", log.getCreatedAt() != null ? log.getCreatedAt().toString() : "",
                    "event", action,
                    "user", email,
                    "name", name.trim(),
                    "ip", log.getIpAddress() != null ? log.getIpAddress() : "—",
                    "level", level,
                    "desc", desc
            );
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Audit logs fetched", result));
    }
}
