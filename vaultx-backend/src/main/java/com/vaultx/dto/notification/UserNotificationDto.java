package com.vaultx.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationDto {
    private UUID id;
    private String title;
    private String message;
    private String type;
    private boolean read;
    private String linkUrl;
    private LocalDateTime createdAt;
}
