package com.vaultx.controller;

import com.vaultx.common.ApiResponse;
import com.vaultx.common.AppConstants;
import com.vaultx.dto.UpdateUserRequest;
import com.vaultx.dto.UserDto;
import com.vaultx.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * User management REST controller.
 * All endpoints require JWT authentication.
 */
@RestController
@RequestMapping(AppConstants.API_V1 + "/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Users", description = "User profile management")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final com.vaultx.service.SessionManagementService sessionManagementService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user's profile")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser() {
        log.debug("GET /users/me — fetching current user profile");
        return ResponseEntity.ok(
                ApiResponse.success("User retrieved successfully", userService.getCurrentUser())
        );
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user's profile information")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        log.debug("PUT /users/profile — updating user profile");
        UUID currentUserId = userService.getCurrentUser().getId();
        return ResponseEntity.ok(
                ApiResponse.success("User updated successfully", userService.updateUser(currentUserId, request))
        );
    }

    @PostMapping("/avatar")
    @Operation(summary = "Upload user avatar")
    public ResponseEntity<ApiResponse<Void>> uploadAvatar(@RequestBody String base64Avatar) {
        log.debug("POST /users/avatar — uploading avatar");
        UUID currentUserId = userService.getCurrentUser().getId();
        userService.updateAvatar(currentUserId, base64Avatar);
        return ResponseEntity.ok(ApiResponse.success("Avatar updated successfully", null));
    }

    @PostMapping("/create-pin")
    @Operation(summary = "Create Vault PIN")
    public ResponseEntity<ApiResponse<Void>> createPin(@Valid @RequestBody com.vaultx.dto.user.CreatePinRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        log.debug("POST /users/create-pin — creating vault pin");
        UUID currentUserId = userService.getCurrentUser().getId();
        userService.createVaultPin(currentUserId, request.getPin(), httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Vault PIN created successfully", null));
    }

    @PutMapping("/change-pin")
    @Operation(summary = "Change Vault PIN")
    public ResponseEntity<ApiResponse<Void>> changePin(@Valid @RequestBody com.vaultx.dto.user.ChangePinRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        log.debug("PUT /users/change-pin — changing vault pin");
        UUID currentUserId = userService.getCurrentUser().getId();
        userService.changeVaultPin(currentUserId, request.getCurrentPin(), request.getNewPin(), httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Vault PIN changed successfully", null));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Get active sessions")
    public ResponseEntity<ApiResponse<java.util.List<com.vaultx.dto.user.SessionDto>>> getSessions(jakarta.servlet.http.HttpServletRequest request) {
        log.debug("GET /users/sessions");
        UserDto currentUser = userService.getCurrentUser();
        UUID currentUserId = currentUser.getId();
        
        String refreshTokenHeader = request.getHeader("X-Refresh-Token");
        java.util.List<com.vaultx.dto.user.SessionDto> sessions = sessionManagementService.getUserSessions(currentUserId, refreshTokenHeader);
        
        boolean currentDeviceTracked = false;
        if (refreshTokenHeader != null) {
            currentDeviceTracked = sessions.stream().anyMatch(s -> refreshTokenHeader.equals(s.getId().toString()) || s.isCurrentSession());
        }

        if (sessions == null || sessions.isEmpty() || (!currentDeviceTracked && refreshTokenHeader != null)) {
            com.vaultx.entity.User userEntity = userService.getUserEntityById(currentUserId);
            if (userEntity != null) {
                String refToken = refreshTokenHeader != null ? refreshTokenHeader : UUID.randomUUID().toString();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                
                // Track this new device if we haven't seen this refresh token
                if (!currentDeviceTracked) {
                    sessionManagementService.trackSession(userEntity, refToken, ip, request.getHeader("User-Agent"));
                    sessions = sessionManagementService.getUserSessions(currentUserId, refToken);
                }
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success("Sessions retrieved", sessions));
    }

    @GetMapping("/sessions/heartbeat")
    @Operation(summary = "Check if current device session is still active")
    public ResponseEntity<?> checkSessionHeartbeat(jakarta.servlet.http.HttpServletRequest request) {
        String refreshToken = request.getHeader("X-Refresh-Token");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(ApiResponse.error("No refresh token provided", null));
        }
        
        boolean exists = sessionManagementService.isSessionActive(refreshToken);
        if (!exists) {
            return ResponseEntity.status(401).body(ApiResponse.error("Session terminated", null));
        }
        return ResponseEntity.ok(ApiResponse.success("Session active", true));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Terminate a session")
    public ResponseEntity<ApiResponse<Void>> terminateSession(@PathVariable UUID id) {
        log.debug("DELETE /users/sessions/{}", id);
        UUID currentUserId = userService.getCurrentUser().getId();
        sessionManagementService.deleteSession(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Session terminated successfully", null));
    }

    @PostMapping("/face-biometric")
    @Operation(summary = "Update or enroll Face ID biometrics")
    public ResponseEntity<ApiResponse<Void>> updateFaceBiometrics(@RequestBody String faceData) {
        log.debug("POST /users/face-biometric");
        UUID currentUserId = userService.getCurrentUser().getId();
        userService.updateFaceBiometrics(currentUserId, faceData);
        return ResponseEntity.ok(ApiResponse.success("Face ID Biometrics updated successfully", null));
    }

    @PostMapping("/wallet-password")
    @Operation(summary = "Update wallet security password")
    public ResponseEntity<ApiResponse<Void>> updateWalletPassword(@RequestBody String walletPassword) {
        log.debug("POST /users/wallet-password");
        UUID currentUserId = userService.getCurrentUser().getId();
        userService.updateWalletPassword(currentUserId, walletPassword);
        return ResponseEntity.ok(ApiResponse.success("Wallet Password updated successfully", null));
    }

    @PostMapping("/verify-pin")
    @Operation(summary = "Verify 6-digit Vault PIN for confidential document unlock")
    public ResponseEntity<ApiResponse<Boolean>> verifyPin(@RequestBody Map<String, String> body) {
        log.debug("POST /users/verify-pin");
        UUID currentUserId = userService.getCurrentUser().getId();
        String pin = body.get("pin");
        boolean valid = userService.verifyVaultPin(currentUserId, pin);
        if (valid) {
            return ResponseEntity.ok(ApiResponse.success("Vault PIN verified successfully", true));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid Vault PIN", false));
        }
    }

    @GetMapping("/storage-stats")
    @Operation(summary = "Get current user's storage statistics")
    public ResponseEntity<ApiResponse<com.vaultx.dto.user.UserStorageStatsDto>> getStorageStats() {
        log.debug("GET /users/storage-stats");
        UUID currentUserId = userService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.success("Storage stats retrieved", userService.getUserStorageStats(currentUserId)));
    }
}
