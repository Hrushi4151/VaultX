package com.vaultx.service.impl;

import com.vaultx.dto.user.SecurityLogDto;
import com.vaultx.entity.SecurityAction;
import com.vaultx.entity.SecurityLog;
import com.vaultx.entity.User;
import com.vaultx.repository.SecurityLogRepository;
import com.vaultx.service.SecurityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SecurityLogServiceImpl implements SecurityLogService {

    private final SecurityLogRepository securityLogRepository;

    @Override
    @Transactional
    public void logAction(User user, SecurityAction action, String ipAddress) {
        if (user == null) return;
        
        SecurityLog log = SecurityLog.builder()
                .user(user)
                .action(action)
                .ipAddress(ipAddress)
                .build();
        securityLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SecurityLogDto> getUserLogs(UUID userId) {
        return securityLogRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private SecurityLogDto mapToDto(SecurityLog log) {
        SecurityLogDto dto = new SecurityLogDto();
        dto.setId(log.getId());
        dto.setAction(log.getAction());
        dto.setIpAddress(log.getIpAddress());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
