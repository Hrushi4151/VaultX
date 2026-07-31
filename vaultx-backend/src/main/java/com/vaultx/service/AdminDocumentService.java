package com.vaultx.service;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.document.DocumentDto;
import org.springframework.data.domain.Pageable;

public interface AdminDocumentService {
    PagedResponse<DocumentDto> getAllDocuments(String search, Pageable pageable);
}
