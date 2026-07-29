package com.vaultx.dto.bundle;

import com.vaultx.dto.document.DocumentDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleDto {
    private UUID id;
    private String name;
    private String description;
    private String color;
    private String icon;
    private boolean favourite;
    private boolean archived;
    private BundleSettingsDto settings;
    private List<BundleDocumentDto> documents;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    
    // Virtual property for frontend ease
    private long totalFileSize;
}
