package com.vaultx.service.impl;

import com.vaultx.common.PagedResponse;
import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.entity.Document;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.DocumentMapper;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.SmartSearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartSearchServiceImpl implements SmartSearchService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final DocumentMapper documentMapper;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto> searchDocuments(String query, Pageable pageable) {
        User user = getCurrentUser();
        
        Page<Document> docPage;
        if (query == null || query.trim().isEmpty()) {
            docPage = documentRepository.findByOwnerIdAndDeletedFalse(user.getId(), pageable);
        } else {
            docPage = documentRepository.smartSearch(user.getId(), query.trim(), pageable);
        }

        List<DocumentDto> content = docPage.getContent().stream()
                .map(documentMapper::toDto)
                .collect(Collectors.toList());

        return PagedResponse.<DocumentDto>builder()
                .content(content)
                .page(docPage.getNumber())
                .size(docPage.getSize())
                .totalElements(docPage.getTotalElements())
                .totalPages(docPage.getTotalPages())
                .last(docPage.isLast())
                .build();
    }
}
