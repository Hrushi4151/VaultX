package com.vaultx.dto.ai;

import com.vaultx.dto.document.DocumentDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringDocumentDto {
    private UUID id;
    private DocumentDto document;
    private LocalDate expiryDate;
    private long daysRemaining;
    private boolean expired;
    private String categoryName;
}
