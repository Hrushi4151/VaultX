package com.vaultx.dto.pdf;

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
public class PdfExportDto {
    private UUID id;
    private String exportName;
    private Long fileSize;
    private String status;
    private String errorMessage;
    private String exportType;
    private String format;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
