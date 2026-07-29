package com.vaultx.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiInsightsSummaryDto {
    private long smartCategorizedCount;
    private long ocrProcessedCount;
    private long expiringDocsCount;
    private String expiringSummary;
    private long duplicateGroupsCount;
    private long duplicateFilesCount;
}
