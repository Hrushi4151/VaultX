package com.vaultx.mapper;

import com.vaultx.dto.notification.UserNotificationDto;
import com.vaultx.entity.UserNotification;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserNotificationMapper {
    UserNotificationDto toDto(UserNotification notification);
}
