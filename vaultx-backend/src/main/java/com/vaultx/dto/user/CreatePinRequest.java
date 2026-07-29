package com.vaultx.dto.user;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreatePinRequest {
    @Pattern(regexp = "^\\d{6}$", message = "PIN must be exactly 6 digits")
    private String pin;
}
