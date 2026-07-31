package com.vaultx.dto.admin;

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
public class AdminDocumentDto {
    private UUID id;
    private String displayName;
    private String originalFilename;
    private String extension;
    private Long fileSize;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String ownerEmail;
}
