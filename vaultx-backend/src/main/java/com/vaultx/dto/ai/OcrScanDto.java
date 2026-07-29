package com.vaultx.dto.ai;

import com.vaultx.dto.document.DocumentDto;
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
public class OcrScanDto {
    private UUID id;
    private DocumentDto document;
    private String extractedTextSnippet;
    private String language;
    private Double confidence;
    private String status;
    private LocalDateTime processedAt;
}
