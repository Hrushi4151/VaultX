package com.vaultx.service.impl;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.notification.UserNotificationDto;
import com.vaultx.entity.User;
import com.vaultx.entity.UserNotification;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.UserNotificationMapper;
import com.vaultx.repository.UserNotificationRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.common.SecurityUtils;
import com.vaultx.service.InAppNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InAppNotificationServiceImpl implements InAppNotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserNotificationMapper notificationMapper;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    @Override
    @Transactional
    public void createNotification(User user, String title, String message, String type, String linkUrl) {
        if (user == null) return;
        UserNotification notification = UserNotification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type != null ? type : "SYSTEM")
                .linkUrl(linkUrl)
                .read(false)
                .build();
        notificationRepository.save(notification);
        log.info("Created in-app notification for user {}: {}", user.getUsername(), title);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserNotificationDto> getUserNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(notificationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserNotificationDto> getUserNotificationsPaged(Pageable pageable) {
        User currentUser = getCurrentUser();
        Page<UserNotification> page = notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable);
        return new PagedResponse<>(page.map(notificationMapper::toDto));
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countByUserIdAndReadFalse(currentUser.getId());
    }

    @Override
    @Transactional
    public UserNotificationDto markAsRead(UUID id) {
        User currentUser = getCurrentUser();
        UserNotification notification = notificationRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toString()));
        notification.setRead(true);
        return notificationMapper.toDto(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationRepository.markAllAsReadByUserId(currentUser.getId());
    }

    @Override
    @Transactional
    public void deleteNotification(UUID id) {
        User currentUser = getCurrentUser();
        UserNotification notification = notificationRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toString()));
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void clearAllNotifications() {
        User currentUser = getCurrentUser();
        notificationRepository.deleteAllByUserId(currentUser.getId());
    }
}
