package com.vaultx.service.impl;

import com.vaultx.entity.Document;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.DuplicateDetectionService;
import com.vaultx.common.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DuplicateDetectionServiceImpl implements DuplicateDetectionService {

    private final DocumentRepository documentRepository;
    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Document> findExactDuplicates(String checksum) {
        User user = getCurrentUser();
        // Return documents with the same checksum owned by this user
        return documentRepository.findByOwnerId(user.getId()).stream()
                .filter(doc -> checksum.equals(doc.getChecksum()) && !doc.isDeleted())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Document> findDuplicatesByName(String displayName) {
        User user = getCurrentUser();
        return documentRepository.findByOwnerId(user.getId()).stream()
                .filter(doc -> displayName.equalsIgnoreCase(doc.getDisplayName()) && !doc.isDeleted())
                .collect(Collectors.toList());
    }
}
