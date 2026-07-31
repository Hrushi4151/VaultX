package com.vaultx.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FaceLoginRequest {

    @NotBlank(message = "Identifier (Email, Username, or Phone Number) is required")
    private String identifier;

    @NotBlank(message = "Scanned Face Data is required")
    private String faceData;
}
