package com.vaultx.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterWithOtpRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    private String lastName;

    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    private String country;

    @NotBlank(message = "OTP code is required")
    private String otp;

    private String walletPassword;

    private String faceData;
}
