package com.vaultx.dto.user;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class SessionDto {
    private UUID id;
    private String ipAddress;
    private String browser;
    private String operatingSystem;
    private Instant loginTime;
    private Instant lastActiveTime;
    private boolean isCurrentSession;
}
