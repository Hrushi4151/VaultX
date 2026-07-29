package com.vaultx.dto.pdf;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfMergeRequestDto {
    private List<UUID> documentIds;
    private boolean includeCoverPage;
    private String coverTitle;
    private String coverDescription;
    private boolean includeToc;
    private boolean includePageNumbers;
    private String pageNumberPosition;
    private String watermarkText;
    private String signatureImageBase64;
    private String watermarkPosition;
    private String ownerPassword;
    private String userPassword;
    private boolean allowPrint;
    private boolean allowCopy;
}
