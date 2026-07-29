package com.vaultx.dto.document;

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
public class DocumentDto {
    private UUID id;
    private String originalFilename;
    private String displayName;
    private String description;
    private CategoryDto category;
    private String mimeType;
    private String extension;
    private Long fileSize;
    private boolean favourite;
    private boolean archived;
    private boolean deleted;
    private LocalDateTime deletedAt;
    private Long daysRemaining;
    private Integer version;
    private List<TagDto> tags;
    private List<CollectionDto> collections;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
