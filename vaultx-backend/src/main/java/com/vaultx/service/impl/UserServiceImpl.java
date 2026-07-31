package com.vaultx.service.impl;

import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.UpdateUserRequest;
import com.vaultx.dto.UserDto;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.UserMapper;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Implementation of {@link UserService} providing user management operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final com.vaultx.repository.DocumentRepository documentRepository;
    private final com.vaultx.repository.ShareRepository shareRepository;
    private final UserMapper userMapper;
    private final SecurityUtils securityUtils;
    private final com.vaultx.service.SecurityLogService securityLogService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public UserDto getCurrentUser() {
        String email = securityUtils.getCurrentUserEmail();
        log.debug("Fetching current user profile for: {}", email);
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return userMapper.toDto(user);
    }

    @Override
    public UserDto findById(UUID id) {
        log.debug("Fetching user by id: {}", id);
        User user = userRepository.findByIdWithRoles(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        return userMapper.toDto(user);
    }

    @Override
    public User getUserEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
    }

    @Override
    public Page<UserDto> findAll(Pageable pageable) {
        log.debug("Fetching all users — page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return userRepository.findAll(pageable).map(userMapper::toDto);
    }

    @Override
    @Transactional
    public UserDto updateUser(UUID id, UpdateUserRequest request) {
        log.info("Updating profile for user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        userMapper.updateEntityFromDto(request, user);
        User saved = userRepository.save(user);
        log.debug("User profile updated successfully: {}", id);
        return userMapper.toDto(saved);
    }

    @Override
    @Transactional
    public void deactivateUser(UUID id) {
        log.info("Deactivating user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        user.setActive(false);
        userRepository.save(user);
        log.info("User deactivated successfully: {}", id);
    }

    @Override
    @Transactional
    public void updateAvatar(UUID id, String avatarBase64) {
        log.info("Updating avatar for user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        user.setProfilePicture(avatarBase64);
        userRepository.save(user);
        
        securityLogService.logAction(user, com.vaultx.entity.SecurityAction.PROFILE_UPDATED, null);
    }

    @Override
    @Transactional
    public void createVaultPin(UUID id, String pin, jakarta.servlet.http.HttpServletRequest httpRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));

        if (user.getVaultPinHash() != null && !user.getVaultPinHash().isEmpty()) {
            throw new com.vaultx.exception.BusinessException("Vault PIN is already set");
        }

        user.setVaultPinHash(passwordEncoder.encode(pin));
        userRepository.save(user);

        securityLogService.logAction(user, com.vaultx.entity.SecurityAction.PIN_CHANGED, getClientIp(httpRequest));
    }

    @Override
    @Transactional
    public void changeVaultPin(UUID id, String currentPin, String newPin, jakarta.servlet.http.HttpServletRequest httpRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));

        if (user.getVaultPinHash() == null || user.getVaultPinHash().isEmpty()) {
            throw new com.vaultx.exception.BusinessException("Vault PIN is not set");
        }

        if (!passwordEncoder.matches(currentPin, user.getVaultPinHash())) {
            throw new com.vaultx.exception.BusinessException("Current PIN is incorrect");
        }

        user.setVaultPinHash(passwordEncoder.encode(newPin));
        userRepository.save(user);

        securityLogService.logAction(user, com.vaultx.entity.SecurityAction.PIN_CHANGED, getClientIp(httpRequest));
    }

    @Override
    @Transactional
    public void updateFaceBiometrics(UUID id, String faceData) {
        log.info("Updating face biometrics for user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        user.setFaceData(faceData);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void updateWalletPassword(UUID id, String walletPassword) {
        log.info("Updating wallet password for user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        user.setWalletPasswordHash(passwordEncoder.encode(walletPassword));
        userRepository.save(user);
    }

    @Override
    public boolean verifyVaultPin(UUID id, String pin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        if (user.getVaultPinHash() == null || user.getVaultPinHash().isEmpty()) {
            return false;
        }
        return passwordEncoder.matches(pin, user.getVaultPinHash());
    }

    @Override
    public com.vaultx.dto.user.UserStorageStatsDto getUserStorageStats(UUID userId) {
        Long totalBytesObj = documentRepository.sumFileSizeByOwnerIdAndDeletedFalse(userId);
        long totalBytes = totalBytesObj != null ? totalBytesObj : 0L;
        long filesCount = documentRepository.countByOwnerIdAndDeletedFalse(userId);
        long sharesCount = shareRepository.countByOwnerId(userId);

        long maxLimit = 5368709120L; // 5.0 GB limit
        double pct = ((double) totalBytes / maxLimit) * 100.0;

        return com.vaultx.dto.user.UserStorageStatsDto.builder()
                .totalBytesUsed(totalBytes)
                .formattedSize(formatBytes(totalBytes))
                .maxStorageLimitBytes(maxLimit)
                .formattedLimit("5.0 GB")
                .usedPercentage(Math.round(pct * 100.0) / 100.0)
                .totalFilesCount(filesCount)
                .totalShareLinksCount(sharesCount)
                .build();
    }

    private String formatBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB", "TB" };
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        return new java.text.DecimalFormat("#,##0.#").format(bytes / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }

    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        if (request == null) return null;
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
