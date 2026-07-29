package com.vaultx.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMobileOtpRequest {
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}
