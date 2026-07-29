package com.vaultx.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAiMetadataDto {
    private UUID id;
    private UUID documentId;
    private String detectedCategory;
    private String detectedType;
    private Double confidenceScore;
    private String extractedFieldsJson;
    private String tagsJson;
    private LocalDateTime processedAt;
}
