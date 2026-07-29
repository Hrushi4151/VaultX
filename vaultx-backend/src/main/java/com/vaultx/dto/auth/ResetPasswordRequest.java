package com.vaultx.dto.auth;

import com.vaultx.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Token is required")
    private String token;

    @ValidPassword
    private String newPassword;
}
