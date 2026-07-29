package com.vaultx.dto.ai;

import com.vaultx.dto.document.DocumentDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartCategorizationDto {
    private UUID id;
    private DocumentDto document;
    private String detectedCategory;
    private String detectedType;
    private Double confidenceScore;
    private List<String> tags;
    private LocalDateTime processedAt;
}
