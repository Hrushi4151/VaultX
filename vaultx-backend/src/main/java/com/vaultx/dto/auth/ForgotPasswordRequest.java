package com.vaultx.dto.auth;

import com.vaultx.validation.ValidEmail;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @ValidEmail
    private String email;
}
