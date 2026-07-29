package com.vaultx.dto.user;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ChangePinRequest {
    @Pattern(regexp = "^\\d{6}$", message = "Current PIN must be exactly 6 digits")
    private String currentPin;

    @Pattern(regexp = "^\\d{6}$", message = "New PIN must be exactly 6 digits")
    private String newPin;
}
