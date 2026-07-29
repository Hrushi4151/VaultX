package com.vaultx.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDocumentAnalysisDto {
    private UUID documentId;
    private String suggestedName;
    private String suggestedCategory;
    private String suggestedType;
    private String suggestedCollectionName;
    private List<String> suggestedCollectionNames;
    private List<String> suggestedTags;
    private String ocrText;
    private Double confidenceScore;
    private String summaryText;
}
