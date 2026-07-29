package com.vaultx.dto.share;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicDocumentDto {
    private UUID id;
    private String displayName;
    private String originalFilename;
    private String mimeType;
    private Long fileSize;
    private String extension;
}
