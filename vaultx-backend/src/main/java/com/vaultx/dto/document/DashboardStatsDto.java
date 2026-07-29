package com.vaultx.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalDocuments;
    private long totalStorageUsed; // in bytes
    private long favouriteDocuments;
    private long archivedDocuments;
    private long trashDocuments;
    private List<CategoryStatDto> categoryBreakdown;
    private List<DocumentActivityDto> recentActivities;
}
