package com.vaultx.controller;

import com.vaultx.common.ApiResponse;
import com.vaultx.dto.auth.*;
import com.vaultx.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user authentication and security")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-email-otp")
    @Operation(summary = "Send OTP to email for registration step 2")
    public ResponseEntity<ApiResponse<Void>> sendEmailOtp(@Valid @RequestBody SendEmailOtpRequest request) {
        authService.sendEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email", null));
    }

    @PostMapping("/verify-email-otp")
    @Operation(summary = "Verify Email OTP")
    public ResponseEntity<ApiResponse<Void>> verifyEmailOtp(@Valid @RequestBody VerifyEmailOtpRequest request) {
        authService.verifyEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", null));
    }

    @PostMapping("/send-mobile-otp")
    @Operation(summary = "Send OTP to mobile phone for registration step 2")
    public ResponseEntity<ApiResponse<Void>> sendMobileOtp(@Valid @RequestBody SendMobileOtpRequest request) {
        authService.sendMobileOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your mobile phone via SMS", null));
    }

    @PostMapping("/verify-mobile-otp")
    @Operation(summary = "Verify Mobile OTP")
    public ResponseEntity<ApiResponse<Void>> verifyMobileOtp(@Valid @RequestBody VerifyMobileOtpRequest request) {
        authService.verifyMobileOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Mobile phone verified successfully", null));
    }

    @PostMapping("/send-registration-otp")
    @Operation(summary = "Send OTP to email and phone for registration")
    public ResponseEntity<ApiResponse<Void>> sendRegistrationOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendRegistrationOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully to your phone and email", null));
    }

    @PostMapping("/register-with-otp")
    @Operation(summary = "Verify OTP and complete user registration")
    public ResponseEntity<ApiResponse<Void>> registerWithOtp(@Valid @RequestBody RegisterWithOtpRequest request) {
        authService.registerWithOtp(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful! Account verified. You can now login.", null));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Please check your email to verify your account.", null));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and get tokens")
    public ResponseEntity<ApiResponse<JwtAuthenticationResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        JwtAuthenticationResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/wallet-login")
    @Operation(summary = "Authenticate user using Wallet Password")
    public ResponseEntity<ApiResponse<JwtAuthenticationResponse>> walletLogin(@Valid @RequestBody WalletLoginRequest request, HttpServletRequest httpRequest) {
        JwtAuthenticationResponse response = authService.walletLogin(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Wallet unlock successful", response));
    }

    @PostMapping("/face-login")
    @Operation(summary = "Authenticate user using Face ID Biometrics")
    public ResponseEntity<ApiResponse<JwtAuthenticationResponse>> faceLogin(@Valid @RequestBody FaceLoginRequest request, HttpServletRequest httpRequest) {
        JwtAuthenticationResponse response = authService.faceLogin(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Face ID authentication successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<JwtAuthenticationResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request, HttpServletRequest httpRequest) {
        JwtAuthenticationResponse response = authService.refreshToken(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current session")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) TokenRefreshRequest request, HttpServletRequest httpRequest) {
        String refreshToken = (request != null) ? request.getRefreshToken() : null;
        authService.logout(refreshToken, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/logout-all")
    @Operation(summary = "Logout from all devices")
    public ResponseEntity<ApiResponse<Void>> logoutAllDevices(HttpServletRequest httpRequest) {
        authService.logoutAllDevices(httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Logged out from all devices successfully", null));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("If the email exists, a password reset link has been sent.", null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now login.", null));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        authService.changePassword(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully. You have been logged out of all other devices.", null));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify user email using token")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. You can now login.", null));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify user phone number using OTP")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Phone number verified successfully. You can now login.", null));
    }
}
