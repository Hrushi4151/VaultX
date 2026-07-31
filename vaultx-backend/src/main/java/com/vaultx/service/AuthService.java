package com.vaultx.service;

import com.vaultx.dto.auth.*;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {
    String sendEmailOtp(SendEmailOtpRequest request);
    void verifyEmailOtp(VerifyEmailOtpRequest request);
    String sendMobileOtp(SendMobileOtpRequest request);
    void verifyMobileOtp(VerifyMobileOtpRequest request);
    void sendRegistrationOtp(SendOtpRequest request);
    void registerWithOtp(RegisterWithOtpRequest request);
    void register(RegisterRequest request);
    void verifyEmail(String token);
    void verifyOtp(VerifyOtpRequest request);
    JwtAuthenticationResponse login(LoginRequest request, HttpServletRequest httpRequest);
    JwtAuthenticationResponse walletLogin(WalletLoginRequest request, HttpServletRequest httpRequest);
    JwtAuthenticationResponse faceLogin(FaceLoginRequest request, HttpServletRequest httpRequest);
    JwtAuthenticationResponse refreshToken(TokenRefreshRequest request, HttpServletRequest httpRequest);
    void logout(String refreshToken, HttpServletRequest httpRequest);
    void logoutAllDevices(HttpServletRequest httpRequest);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
    void changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest);
}
