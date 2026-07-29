package com.vaultx.service.impl;

import com.vaultx.dto.user.SessionDto;
import com.vaultx.entity.Session;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.repository.SessionRepository;
import com.vaultx.service.SessionManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua_parser.Client;
import ua_parser.Parser;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionManagementServiceImpl implements SessionManagementService {

    private final SessionRepository sessionRepository;
    private final Parser uaParser = new Parser();

    @Override
    @Transactional
    public Session trackSession(User user, String refreshToken, String ipAddress, String userAgent) {
        String browser = "Unknown";
        String os = "Unknown";

        if (userAgent != null) {
            Client client = uaParser.parse(userAgent);
            browser = client.userAgent.family + " " + client.userAgent.major;
            os = client.os.family + " " + client.os.major;
        }

        Session session = Session.builder()
                .user(user)
                .refreshToken(refreshToken)
                .ipAddress(ipAddress)
                .browser(browser)
                .operatingSystem(os)
                .loginTime(Instant.now())
                .lastActiveTime(Instant.now())
                .build();

        return sessionRepository.save(session);
    }

    @Override
    @Transactional
    public void updateSessionActivity(String refreshToken) {
        sessionRepository.findByRefreshToken(refreshToken).ifPresent(session -> {
            session.setLastActiveTime(Instant.now());
            sessionRepository.save(session);
        });
    }

    @Override
    @Transactional
    public void invalidateSession(String refreshToken) {
        sessionRepository.deleteByRefreshToken(refreshToken);
    }

    @Override
    @Transactional
    public void invalidateAllUserSessions(UUID userId) {
        sessionRepository.deleteByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SessionDto> getUserSessions(UUID userId, String currentRefreshToken) {
        return sessionRepository.findByUserId(userId).stream()
                .map(session -> mapToDto(session, currentRefreshToken))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteSession(UUID userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId.toString()));
        
        if (!session.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Session", "id", sessionId.toString()); // Don't leak exists status
        }
        
        sessionRepository.delete(session);
    }

    private SessionDto mapToDto(Session session, String currentRefreshToken) {
        SessionDto dto = new SessionDto();
        dto.setId(session.getId());
        dto.setIpAddress(session.getIpAddress());
        dto.setBrowser(session.getBrowser());
        dto.setOperatingSystem(session.getOperatingSystem());
        dto.setLoginTime(session.getLoginTime());
        dto.setLastActiveTime(session.getLastActiveTime());
        dto.setCurrentSession(currentRefreshToken != null && currentRefreshToken.equals(session.getRefreshToken()));
        return dto;
    }
}
