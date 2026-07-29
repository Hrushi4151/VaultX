package com.vaultx.service;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.document.DocumentDto;
import org.springframework.data.domain.Pageable;

public interface SmartSearchService {
    PagedResponse<DocumentDto> searchDocuments(String query, Pageable pageable);
}
