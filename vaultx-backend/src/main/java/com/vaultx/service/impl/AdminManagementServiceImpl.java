package com.vaultx.service.impl;

import com.vaultx.dto.admin.AdminDocumentDto;
import com.vaultx.dto.admin.AdminUserDto;
import com.vaultx.entity.Document;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.ShareRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.AdminManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminManagementServiceImpl implements AdminManagementService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ShareRepository shareRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDto> searchUsers(String query, String status, Pageable pageable) {
        if (status == null || status.isBlank()) {
            status = "ALL";
        }
        Page<User> userPage = userRepository.searchUsersWithStatus(query, status, pageable);

        List<AdminUserDto> dtos = userPage.getContent().stream().map(user -> {
            long docCount = documentRepository.countByOwnerId(user.getId());
            long shareCount = shareRepository.countByOwnerId(user.getId());
            long storageUsed = documentRepository.findAll().stream()
                    .filter(d -> d.getOwner().getId().equals(user.getId()) && !d.isDeleted())
                    .mapToLong(Document::getFileSize)
                    .sum();
            
            return AdminUserDto.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .phoneNumber(user.getPhoneNumber())
                    .country(user.getCountry())
                    .active(user.isActive())
                    .deleted(user.isDeleted())
                    .emailVerified(user.isEmailVerified())
                    .createdAt(user.getCreatedAt())
                    .lastLoginAt(user.getUpdatedAt()) // placeholder for last login
                    .totalDocuments(docCount)
                    .totalStorageUsed(storageUsed)
                    .activeSecureLinks(shareCount)
                    .build();
        }).collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, userPage.getTotalElements());
    }

    @Override
    @Transactional
    public void suspendUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void activateUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toString()));
        user.setActive(true);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminDocumentDto> searchDocuments(String query, Pageable pageable) {
        Page<Document> docs;
        if (query != null && !query.isBlank()) {
            docs = documentRepository.findByOriginalFilenameContainingIgnoreCase(query, pageable);
        } else {
            docs = documentRepository.findAll(pageable);
        }

        List<AdminDocumentDto> dtos = docs.getContent().stream().map(d -> AdminDocumentDto.builder()
                .id(d.getId())
                .displayName(d.getDisplayName())
                .originalFilename(d.getOriginalFilename())
                .extension(d.getExtension())
                .fileSize(d.getFileSize())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .ownerEmail(d.getOwner().getEmail())
                .build()).collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, docs.getTotalElements());
    }
}
