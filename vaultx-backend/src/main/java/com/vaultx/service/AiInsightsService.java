package com.vaultx.service;

import com.vaultx.dto.ai.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface AiInsightsService {
    AiInsightsSummaryDto getSummary();
    List<SmartCategorizationDto> getSmartCategorizations();
    List<OcrScanDto> getOcrScans();
    List<ExpiringDocumentDto> getExpiringDocuments();
    List<DuplicateGroupDto> getDuplicateGroups();
    void setDocumentExpiry(UUID documentId, LocalDate expiryDate);
}
