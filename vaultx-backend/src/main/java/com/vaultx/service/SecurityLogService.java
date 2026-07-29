package com.vaultx.service;

import com.vaultx.dto.user.SecurityLogDto;
import com.vaultx.entity.SecurityAction;
import com.vaultx.entity.User;

import java.util.List;
import java.util.UUID;

public interface SecurityLogService {
    void logAction(User user, SecurityAction action, String ipAddress);
    List<SecurityLogDto> getUserLogs(UUID userId);
}
