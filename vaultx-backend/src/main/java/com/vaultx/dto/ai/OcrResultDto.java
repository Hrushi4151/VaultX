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
public class OcrResultDto {
    private UUID id;
    private UUID documentId;
    private String extractedText;
    private String language;
    private Double confidence;
    private String status;
    private String errorMessage;
    private LocalDateTime processedAt;
}
