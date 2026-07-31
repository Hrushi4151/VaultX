package com.vaultx.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStorageStatsDto {
    private long totalBytesUsed;
    private String formattedSize;
    private long maxStorageLimitBytes;
    private String formattedLimit;
    private double usedPercentage;
    private long totalFilesCount;
    private long totalShareLinksCount;
}
