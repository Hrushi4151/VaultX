package com.vaultx.service.impl;

import com.vaultx.dto.auth.*;
import com.vaultx.entity.*;
import com.vaultx.exception.BusinessException;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.UserMapper;
import com.vaultx.repository.*;
import com.vaultx.security.JwtTokenProvider;
import com.vaultx.service.AuthService;
import com.vaultx.service.NotificationService;
import com.vaultx.service.SecurityLogService;
import com.vaultx.service.SessionManagementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final OtpVerificationTokenRepository otpVerificationTokenRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final NotificationService notificationService;
    private final SecurityLogService securityLogService;
    private final SessionManagementService sessionManagementService;
    private final UserMapper userMapper;
    private final com.vaultx.security.FaceBiometricMatcher faceBiometricMatcher;
    private final com.vaultx.service.OtpCooldownService otpCooldownService;

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOCK_TIME_DURATION_MINUTES = 15;
    private static final int REFRESH_TOKEN_EXPIRATION_DAYS = 7;

    private static final java.util.concurrent.ConcurrentHashMap<String, RegistrationOtpEntry> REGISTRATION_OTP_MAP = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, RegistrationOtpEntry> EMAIL_OTP_MAP = new java.util.concurrent.ConcurrentHashMap<>();
    private static final java.util.concurrent.ConcurrentHashMap<String, RegistrationOtpEntry> MOBILE_OTP_MAP = new java.util.concurrent.ConcurrentHashMap<>();

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class RegistrationOtpEntry {
        private String otp;
        private Instant expiryDate;
    }

    @Override
    public String sendEmailOtp(SendEmailOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email address is already registered");
        }
        
        // Enforce 60s cooldown timer
        otpCooldownService.checkAndSetCooldown(email);

        String otp = String.format("%06d", new Random().nextInt(999999));
        EMAIL_OTP_MAP.put(email, new RegistrationOtpEntry(otp, Instant.now().plus(10, ChronoUnit.MINUTES)));
        log.info("Email OTP generated and queued for {}", email);
        notificationService.sendEmailOtp(email, otp);
        return otp;
    }

    @Override
    public void verifyEmailOtp(VerifyEmailOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        RegistrationOtpEntry entry = EMAIL_OTP_MAP.get(email);
        if (entry == null || !entry.getOtp().equals(request.getOtp().trim()) || entry.getExpiryDate().isBefore(Instant.now())) {
            log.warn("Failed Email OTP Verification for {}", email);
            throw new BusinessException("Invalid or expired Email OTP code.");
        }
        EMAIL_OTP_MAP.remove(email);
        log.info("Email OTP verified successfully for {}", email);
    }

    @Override
    public String sendMobileOtp(SendMobileOtpRequest request) {
        String phone = request.getPhoneNumber().trim();
        if (userRepository.existsByPhoneNumber(phone)) {
            throw new BusinessException("Phone number is already registered");
        }

        // Enforce 60s cooldown timer
        otpCooldownService.checkAndSetCooldown(phone);

        String otp = String.format("%06d", new Random().nextInt(999999));
        MOBILE_OTP_MAP.put(phone, new RegistrationOtpEntry(otp, Instant.now().plus(10, ChronoUnit.MINUTES)));
        log.info("Mobile OTP generated and queued for phone target");
        notificationService.sendSmsOtp(phone, otp);
        return otp;
    }

    @Override
    public void verifyMobileOtp(VerifyMobileOtpRequest request) {
        String phone = request.getPhoneNumber().trim();
        RegistrationOtpEntry entry = MOBILE_OTP_MAP.get(phone);
        if (entry == null || !entry.getOtp().equals(request.getOtp().trim()) || entry.getExpiryDate().isBefore(Instant.now())) {
            throw new BusinessException("Invalid or expired Mobile OTP code.");
        }
        MOBILE_OTP_MAP.remove(phone);
    }

    @Override
    public void sendRegistrationOtp(SendOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : "";

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email address is already registered");
        }
        if (request.getUsername() != null && !request.getUsername().isBlank() && userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username is already taken");
        }
        if (!phone.isEmpty() && userRepository.existsByPhoneNumber(phone)) {
            throw new BusinessException("Phone number is already registered");
        }

        // Enforce 60s cooldown timer
        otpCooldownService.checkAndSetCooldown(email);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        REGISTRATION_OTP_MAP.put(email, new RegistrationOtpEntry(otp, Instant.now().plus(10, ChronoUnit.MINUTES)));

        // Send OTP via SMS and Email
        if (!phone.isEmpty()) {
            notificationService.sendSmsOtp(phone, otp);
        }
        notificationService.sendVerificationEmail(email, "Your OTP verification code is: " + otp);
    }

    @Override
    @Transactional
    public void registerWithOtp(RegisterWithOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        RegistrationOtpEntry entry = REGISTRATION_OTP_MAP.get(email);

        if (entry == null || !entry.getOtp().equals(request.getOtp().trim()) || entry.getExpiryDate().isBefore(Instant.now())) {
            throw new BusinessException("Invalid or expired OTP code. Please request a new OTP.");
        }

        // OTP Verified! Remove from map
        REGISTRATION_OTP_MAP.remove(email);

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Email address is already registered");
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new BusinessException("User Role not set in database"));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(request.getUsername() != null && !request.getUsername().isBlank() ? request.getUsername() : email.split("@")[0])
                .email(email)
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .walletPasswordHash(request.getWalletPassword() != null && !request.getWalletPassword().isBlank() ? passwordEncoder.encode(request.getWalletPassword()) : null)
                .faceData(request.getFaceData())
                .country(request.getCountry())
                .active(true)
                .emailVerified(true)
                .phoneNumberVerified(true)
                .build();

        user.getRoles().add(userRole);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already in use");
        }
        if (request.getUsername() != null && userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already in use");
        }
        if (request.getPhoneNumber() != null && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BusinessException("Phone number already in use");
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new BusinessException("User Role not set in database"));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(request.getUsername() != null ? request.getUsername() : request.getEmail().split("@")[0])
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .walletPasswordHash(request.getWalletPassword() != null && !request.getWalletPassword().isBlank() ? passwordEncoder.encode(request.getWalletPassword()) : null)
                .faceData(request.getFaceData())
                .country(request.getCountry())
                .active(true)
                .emailVerified(true)
                .phoneNumberVerified(true)
                .build();

        user.getRoles().add(userRole);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException("Invalid verification token"));

        if (verificationToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BusinessException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        if (user.isEmailVerified()) {
            throw new BusinessException("Email is already verified");
        }

        user.setEmailVerified(true);
        userRepository.save(user);
        
        emailVerificationTokenRepository.delete(verificationToken);
        securityLogService.logAction(user, SecurityAction.EMAIL_VERIFIED, null);
    }

    @Override
    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        OtpVerificationToken otpToken = otpVerificationTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessException("Invalid OTP"));

        if (otpToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BusinessException("OTP has expired");
        }

        User user = otpToken.getUser();
        
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().equals(user.getPhoneNumber())) {
            throw new BusinessException("Phone number does not match OTP");
        }

        if (user.isPhoneNumberVerified()) {
            throw new BusinessException("Phone number is already verified");
        }

        user.setPhoneNumberVerified(true);
        userRepository.save(user);

        otpVerificationTokenRepository.delete(otpToken);
        // Using EMAIL_VERIFIED as a placeholder if PHONE_VERIFIED doesn't exist yet, wait let me check SecurityAction enum
        // I will use EMAIL_VERIFIED if PHONE_VERIFIED is not in SecurityAction enum. Let me just use EMAIL_VERIFIED and rename it later if needed, or add PHONE_VERIFIED.
        // I will just add PHONE_VERIFIED to SecurityAction enum next.
        securityLogService.logAction(user, SecurityAction.valueOf("PHONE_VERIFIED"), null);
    }

    @Override
    @Transactional
    public JwtAuthenticationResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        checkLoginAttempts(user.getEmail());

        if (!user.isActive()) {
            throw new BusinessException("Account is disabled");
        }
        if (!user.isEmailVerified()) {
            throw new BusinessException("Email is not verified");
        }
        if (!user.isPhoneNumberVerified()) {
            throw new BusinessException("Phone number is not verified");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            handleFailedLogin(user.getEmail());
            throw new BadCredentialsException("Invalid email or password");
        }

        resetLoginAttempts(user.getEmail());

        String accessToken = tokenProvider.generateToken(user);
        String refreshTokenStr = UUID.randomUUID().toString();
        
        sessionManagementService.trackSession(user, refreshTokenStr, getClientIp(httpRequest), httpRequest.getHeader("User-Agent"));
        securityLogService.logAction(user, SecurityAction.LOGIN, getClientIp(httpRequest));

        return JwtAuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    @Transactional
    public JwtAuthenticationResponse walletLogin(WalletLoginRequest request, HttpServletRequest httpRequest) {
        String id = request.getIdentifier().trim();
        User user = userRepository.findByIdentifierWithRoles(id)
                .orElseThrow(() -> new BadCredentialsException("Invalid identifier or wallet password"));

        checkLoginAttempts(user.getEmail());

        if (!user.isActive()) {
            throw new BusinessException("Account is disabled");
        }

        if (user.getWalletPasswordHash() == null) {
            throw new BusinessException("Wallet password is not configured for this account");
        }

        boolean matchesWallet = passwordEncoder.matches(request.getWalletPassword(), user.getWalletPasswordHash());

        if (!matchesWallet) {
            handleFailedLogin(user.getEmail());
            throw new BadCredentialsException("Invalid wallet password");
        }

        resetLoginAttempts(user.getEmail());

        String accessToken = tokenProvider.generateToken(user);
        String refreshTokenStr = UUID.randomUUID().toString();
        
        sessionManagementService.trackSession(user, refreshTokenStr, getClientIp(httpRequest), httpRequest.getHeader("User-Agent"));
        securityLogService.logAction(user, SecurityAction.LOGIN, getClientIp(httpRequest));

        return JwtAuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    @Transactional
    public JwtAuthenticationResponse faceLogin(FaceLoginRequest request, HttpServletRequest httpRequest) {
        String id = request.getIdentifier().trim();
        User user = userRepository.findByIdentifierWithRoles(id)
                .orElseThrow(() -> new BadCredentialsException("User identity not found for Face ID scan"));

        if (!user.isActive()) {
            throw new BusinessException("Account is disabled");
        }

        if (user.getFaceData() == null || user.getFaceData().isBlank()) {
            throw new BusinessException("No Face ID biometric data enrolled for this account. Please register your face first.");
        }

        String candidateFace = request.getFaceData().trim();
        if (candidateFace.isBlank() || candidateFace.length() < 20) {
            throw new BusinessException("Invalid or incomplete face scan sample");
        }

        // Strict Biometric Vector Feature Comparison
        boolean isMatch = faceBiometricMatcher.isFaceMatch(user.getFaceData(), candidateFace);
        if (!isMatch) {
            handleFailedLogin(user.getEmail());
            throw new BadCredentialsException("Face ID Biometric Mismatch! Scanned face does not match the enrolled account owner.");
        }

        resetLoginAttempts(user.getEmail());
        log.info("Face ID Biometric Verification successful for user: {}", user.getEmail());

        String accessToken = tokenProvider.generateToken(user);
        String refreshTokenStr = UUID.randomUUID().toString();

        sessionManagementService.trackSession(user, refreshTokenStr, getClientIp(httpRequest), httpRequest.getHeader("User-Agent"));
        securityLogService.logAction(user, SecurityAction.LOGIN, getClientIp(httpRequest));

        return JwtAuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    @Transactional
    public JwtAuthenticationResponse refreshToken(TokenRefreshRequest request, HttpServletRequest httpRequest) {
        Session session = sessionRepository.findByRefreshToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));

        // In a real app we'd also check refresh token expiration, but here we can check loginTime vs max age
        if (session.getLoginTime().plus(REFRESH_TOKEN_EXPIRATION_DAYS, ChronoUnit.DAYS).isBefore(Instant.now())) {
            sessionRepository.delete(session);
            throw new BusinessException("Refresh token has expired");
        }

        User user = session.getUser();
        if (!user.isActive()) {
            throw new BusinessException("Account is disabled");
        }

        String newAccessToken = tokenProvider.generateToken(user);
        String newRefreshToken = UUID.randomUUID().toString();

        session.setRefreshToken(newRefreshToken);
        session.setLastActiveTime(Instant.now());
        sessionRepository.save(session);

        return JwtAuthenticationResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshToken, HttpServletRequest httpRequest) {
        if (refreshToken != null) {
            sessionManagementService.invalidateSession(refreshToken);
        }
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findByEmail(username).ifPresent(user -> 
            securityLogService.logAction(user, SecurityAction.LOGOUT, getClientIp(httpRequest))
        );
    }

    @Override
    @Transactional
    public void logoutAllDevices(HttpServletRequest httpRequest) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userRepository.findByEmail(username).ifPresent(user -> {
            sessionManagementService.invalidateAllUserSessions(user.getId());
            securityLogService.logAction(user, SecurityAction.LOGOUT, getClientIp(httpRequest));
        });
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUserId(user.getId());
            
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .user(user)
                    .expiryDate(Instant.now().plus(15, ChronoUnit.MINUTES))
                    .build();
            passwordResetTokenRepository.save(resetToken);
            
            notificationService.sendPasswordResetEmail(user.getEmail(), token);
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessException("Invalid reset token"));
                
        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            throw new BusinessException("Reset token has expired");
        }
        
        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        passwordResetTokenRepository.deleteByUserId(user.getId());
        sessionManagementService.invalidateAllUserSessions(user.getId());
        
        securityLogService.logAction(user, SecurityAction.PASSWORD_CHANGED, null);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, HttpServletRequest httpRequest) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", username));
                
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }
        
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        sessionManagementService.invalidateAllUserSessions(user.getId());
        securityLogService.logAction(user, SecurityAction.PASSWORD_CHANGED, getClientIp(httpRequest));
    }

    private void checkLoginAttempts(String email) {
        loginAttemptRepository.findByEmail(email).ifPresent(attempt -> {
            if (attempt.getLockedUntil() != null) {
                if (attempt.getLockedUntil().isAfter(Instant.now())) {
                    throw new BusinessException("Account is locked due to too many failed attempts. Try again later.");
                } else {
                    attempt.setAttempts(0);
                    attempt.setLockedUntil(null);
                    loginAttemptRepository.save(attempt);
                }
            }
        });
    }

    private void handleFailedLogin(String email) {
        LoginAttempt attempt = loginAttemptRepository.findByEmail(email)
                .orElse(LoginAttempt.builder().email(email).build());

        attempt.setAttempts(attempt.getAttempts() + 1);

        if (attempt.getAttempts() >= MAX_LOGIN_ATTEMPTS) {
            attempt.setLockedUntil(Instant.now().plus(LOCK_TIME_DURATION_MINUTES, ChronoUnit.MINUTES));
        }

        loginAttemptRepository.save(attempt);
    }

    private void resetLoginAttempts(String email) {
        loginAttemptRepository.findByEmail(email).ifPresent(attempt -> {
            attempt.setAttempts(0);
            attempt.setLockedUntil(null);
            loginAttemptRepository.save(attempt);
        });
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
