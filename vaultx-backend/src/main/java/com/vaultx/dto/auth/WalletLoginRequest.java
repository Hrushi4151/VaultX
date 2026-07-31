package com.vaultx.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WalletLoginRequest {

    @NotBlank(message = "Identifier (Email, Username, or Phone Number) is required")
    private String identifier;

    @NotBlank(message = "Wallet password is required")
    private String walletPassword;
}
