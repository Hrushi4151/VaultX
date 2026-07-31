package com.vaultx.service;

import com.vaultx.dto.auth.JwtAuthenticationResponse;
import com.vaultx.dto.auth.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;

public interface AdminAuthService {
    JwtAuthenticationResponse login(LoginRequest request, HttpServletRequest httpRequest);
    void logout(String refreshToken, HttpServletRequest httpRequest);
}
