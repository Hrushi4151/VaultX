package com.vaultx.dto.bundle;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BundleUpdateRequest {
    
    @NotBlank(message = "Bundle name is required")
    private String name;
    
    private String description;
    
    private BundleSettingsDto settings;
}
