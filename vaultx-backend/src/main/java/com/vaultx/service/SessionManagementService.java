package com.vaultx.service;

import com.vaultx.dto.user.SessionDto;
import com.vaultx.entity.Session;
import com.vaultx.entity.User;

import java.util.List;
import java.util.UUID;

public interface SessionManagementService {
    Session trackSession(User user, String refreshToken, String ipAddress, String userAgent);
    void updateSessionActivity(String refreshToken);
    void invalidateSession(String refreshToken);
    void invalidateAllUserSessions(UUID userId);
    List<SessionDto> getUserSessions(UUID userId, String currentRefreshToken);
    void deleteSession(UUID userId, UUID sessionId);
}
