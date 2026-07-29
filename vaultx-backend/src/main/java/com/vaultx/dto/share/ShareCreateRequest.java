package com.vaultx.dto.share;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class ShareCreateRequest {
    @NotBlank
    private String name;
    
    @NotBlank
    private String targetType; // DOCUMENT, COLLECTION, BUNDLE
    
    @NotNull
    private List<UUID> documentIds; // Depending on targetType, how we link
    
    // Optional Security
    private String password;
    private ZonedDateTime expiresAt;
    private Integer maxDownloads;
    
    // Permissions
    private boolean allowDownload = true;
    private boolean allowPrint = false;
    private boolean allowCopy = false;
    private boolean allowPdfExport = false;
}
