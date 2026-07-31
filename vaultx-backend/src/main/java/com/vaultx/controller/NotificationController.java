package com.vaultx.controller;

import com.vaultx.common.ApiResponse;
import com.vaultx.common.PagedResponse;
import com.vaultx.dto.notification.UserNotificationDto;
import com.vaultx.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final InAppNotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<UserNotificationDto>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<UserNotificationDto> response = notificationService.getUserNotificationsPaged(pageable);
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", response));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<UserNotificationDto>>> getAllNotifications() {
        List<UserNotificationDto> response = notificationService.getUserNotifications();
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", response));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved successfully", Map.of("unreadCount", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<UserNotificationDto>> markAsRead(@PathVariable UUID id) {
        UserNotificationDto updated = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", updated));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable UUID id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted", null));
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<ApiResponse<Void>> clearAllNotifications() {
        notificationService.clearAllNotifications();
        return ResponseEntity.ok(ApiResponse.success("All notifications cleared", null));
    }
}
