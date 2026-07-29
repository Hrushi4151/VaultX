package com.vaultx.dto.share;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicShareMetadataDto {
    private String name;
    private String ownerName;
    private LocalDateTime sharedOn;
    private LocalDateTime expiresAt;
    private boolean isPasswordProtected;
    private boolean isActive;
    private int fileCount;
    // We intentionally do not expose other files or paths until authenticated or password is provided
}
