package com.vaultx.dto.bundle;

import jakarta.validation.constraints.NotBlank;
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
public class BundleCreateRequest {
    
    @NotBlank(message = "Bundle name is required")
    private String name;
    
    private String description;
    private String color;
    private String icon;
    
    private BundleSettingsDto settings;
    private List<UUID> documentIds;
}
