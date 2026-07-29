package com.vaultx.dto.bundle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleSettingsDto {
    private UUID id;
    private boolean includeCoverPage;
    private boolean includeToc;
    private boolean includePageNumbers;
    private String watermarkText;
    private boolean compressOutput;
    private String outputName;
}
