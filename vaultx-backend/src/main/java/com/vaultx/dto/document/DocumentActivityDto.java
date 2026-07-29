package com.vaultx.dto.document;

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
public class DocumentActivityDto {
    private UUID id;
    private String action;
    private String details;
    private LocalDateTime createdAt;
    // Potentially include user summary (e.g. name)
    private String userFullName;
}
