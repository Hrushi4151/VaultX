package com.vaultx.dto.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long verifiedUsers;
    private long activeUsers;
    private long onlineUsers; // Mocked for now
    
    private long totalDocuments;
    private long totalStorageUsed;
    private long totalSharedLinks;
    private long totalOcrJobs;
    private long totalAiClassifications;

    // Charts data
    private Map<String, Long> uploadsLast7Days;
    private Map<String, Long> userSignupsLast7Days;
    private Map<String, Long> documentsByCategory;
}
