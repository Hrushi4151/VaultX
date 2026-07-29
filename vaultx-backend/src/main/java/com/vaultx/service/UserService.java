package com.vaultx.service;

import com.vaultx.dto.UpdateUserRequest;
import com.vaultx.dto.UserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service contract for user management operations.
 */
public interface UserService {

    UserDto getCurrentUser();

    UserDto findById(UUID id);

    Page<UserDto> findAll(Pageable pageable);

    UserDto updateUser(UUID id, UpdateUserRequest request);

    void deactivateUser(UUID id);

    void updateAvatar(UUID id, String avatarBase64);

    void createVaultPin(UUID id, String pin, jakarta.servlet.http.HttpServletRequest httpRequest);

    void changeVaultPin(UUID id, String currentPin, String newPin, jakarta.servlet.http.HttpServletRequest httpRequest);
}
