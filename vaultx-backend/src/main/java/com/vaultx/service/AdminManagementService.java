package com.vaultx.service;

import com.vaultx.dto.admin.AdminDocumentDto;
import com.vaultx.dto.admin.AdminUserDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface AdminManagementService {
    Page<AdminUserDto> searchUsers(String query, String status, Pageable pageable);
    void suspendUser(UUID id);
    void activateUser(UUID id);
    Page<AdminDocumentDto> searchDocuments(String query, Pageable pageable);
}
