package com.vaultx.service.impl;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.entity.Document;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.service.AdminDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminDocumentServiceImpl implements AdminDocumentService {

    private final DocumentRepository documentRepository;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto> getAllDocuments(String search, Pageable pageable) {
        Page<Document> documents;
        if (search == null || search.trim().isEmpty()) {
            documents = documentRepository.findAll(pageable);
        } else {
            documents = documentRepository.adminSmartSearch(search, pageable);
        }

        return PagedResponse.<DocumentDto>builder()
                .content(documents.getContent().stream()
                        .map(this::mapToDto)
                        .collect(Collectors.toList()))
                .page(documents.getNumber())
                .size(documents.getSize())
                .totalElements(documents.getTotalElements())
                .totalPages(documents.getTotalPages())
                .last(documents.isLast())
                .build();
    }

    private DocumentDto mapToDto(Document d) {
        return DocumentDto.builder()
                .id(d.getId())
                .displayName(d.getDisplayName())
                .originalFilename(d.getOriginalFilename())
                .mimeType(d.getMimeType())
                .fileSize(d.getFileSize())
                .extension(d.getExtension())
                .description(d.getDescription())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .version(d.getVersion())
                .deleted(d.isDeleted())
                .archived(d.isArchived())
                .favourite(d.isFavourite())
                .build();
    }
}
