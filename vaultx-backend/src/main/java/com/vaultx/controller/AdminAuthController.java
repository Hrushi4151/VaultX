package com.vaultx.controller;

import com.vaultx.dto.auth.JwtAuthenticationResponse;
import com.vaultx.dto.auth.LoginRequest;
import com.vaultx.service.AdminAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
@Tag(name = "Admin Authentication", description = "Endpoints for administrator authentication")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate an admin and return a JWT token")
    public ResponseEntity<JwtAuthenticationResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(adminAuthService.login(request, httpRequest));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout admin")
    public ResponseEntity<Void> logout(@RequestHeader(value = "x-refresh-token", required = false) String refreshToken, HttpServletRequest httpRequest) {
        adminAuthService.logout(refreshToken, httpRequest);
        return ResponseEntity.ok().build();
    }
}
