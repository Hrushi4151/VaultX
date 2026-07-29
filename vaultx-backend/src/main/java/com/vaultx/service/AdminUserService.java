package com.vaultx.service;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.UserDto;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminUserService {
    PagedResponse<UserDto> getAllUsers(String search, Pageable pageable);
    void suspendUser(UUID userId);
    void activateUser(UUID userId);
    void deleteUser(UUID userId);
}
