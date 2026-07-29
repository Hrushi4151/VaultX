package com.vaultx.dto.bundle;

import com.vaultx.dto.document.DocumentDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleDocumentDto {
    private UUID id;
    private DocumentDto document;
    private Integer orderIndex;
}
