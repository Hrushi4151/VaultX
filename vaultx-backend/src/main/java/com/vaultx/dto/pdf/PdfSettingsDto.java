package com.vaultx.dto.pdf;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfSettingsDto {
    private UUID id;
    private boolean includeCoverPage;
    private boolean includeToc;
    private String pageNumbersPosition;
    private String watermarkText;
    private Double watermarkOpacity;
    private Integer watermarkRotation;
    private String watermarkColor;
    private String compressionLevel;
    private String ownerPassword;
    private String userPassword;
    private boolean allowPrint;
    private boolean allowCopy;
    private boolean allowEdit;
}
