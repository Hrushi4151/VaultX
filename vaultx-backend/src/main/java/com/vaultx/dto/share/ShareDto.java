package com.vaultx.dto.share;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

import java.util.List;
import com.vaultx.dto.document.DocumentDto;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareDto {
    private UUID id;
    private String token;
    private String name;
    private String targetType;
    private boolean isPasswordProtected;
    private LocalDateTime expiresAt;
    private Integer maxDownloads;
    private Integer downloadsCount;
    private Integer viewsCount;
    private boolean isActive;
    
    // Permissions
    private boolean allowDownload;
    private boolean allowPrint;
    private boolean allowCopy;
    private boolean allowPdfExport;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DocumentDto> documents;
}
