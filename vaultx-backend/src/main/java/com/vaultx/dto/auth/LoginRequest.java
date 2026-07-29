package com.vaultx.dto.auth;

import com.vaultx.validation.ValidEmail;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @ValidEmail
    private String email;

    @NotBlank(message = "Password is required")
    private String password;
    
    private boolean rememberMe;
}
