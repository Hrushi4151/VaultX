package com.vaultx.dto.auth;

import com.vaultx.validation.ValidEmail;
import com.vaultx.validation.ValidPassword;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    private String lastName;

    private String username;

    @ValidEmail
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format (e.g., +1234567890)")
    private String phoneNumber;

    @ValidPassword
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    private String country;

    @AssertTrue(message = "You must accept the terms and conditions")
    private boolean termsAccepted;

    private String walletPassword;

    private String faceData;
}
