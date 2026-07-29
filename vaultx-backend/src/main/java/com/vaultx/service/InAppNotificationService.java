package com.vaultx.service;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.notification.UserNotificationDto;
import com.vaultx.entity.User;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InAppNotificationService {
    void createNotification(User user, String title, String message, String type, String linkUrl);
    List<UserNotificationDto> getUserNotifications();
    PagedResponse<UserNotificationDto> getUserNotificationsPaged(Pageable pageable);
    long getUnreadCount();
    UserNotificationDto markAsRead(UUID id);
    void markAllAsRead();
    void deleteNotification(UUID id);
    void clearAllNotifications();
}
