package com.vaultx.dto.user;

import com.vaultx.entity.SecurityAction;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class SecurityLogDto {
    private UUID id;
    private SecurityAction action;
    private String ipAddress;
    private LocalDateTime createdAt;
}
