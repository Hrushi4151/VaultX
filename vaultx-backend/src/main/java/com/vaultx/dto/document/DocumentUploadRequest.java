package com.vaultx.dto.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadRequest {
    private String description;
    private UUID categoryId;
    private List<UUID> tagIds;
    private List<UUID> collectionIds;
}
