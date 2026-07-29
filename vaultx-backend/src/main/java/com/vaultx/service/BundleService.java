package com.vaultx.service;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.bundle.BundleCreateRequest;
import com.vaultx.dto.bundle.BundleUpdateRequest;
import com.vaultx.dto.bundle.BundleDto;
import com.vaultx.dto.bundle.DocumentReorderRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface BundleService {
    BundleDto createBundle(BundleCreateRequest request);
    BundleDto updateBundle(UUID id, BundleUpdateRequest request);
    PagedResponse<BundleDto> getUserBundles(Pageable pageable);
    BundleDto getBundleById(UUID id);
    BundleDto duplicateBundle(UUID id);
    BundleDto toggleFavourite(UUID id);
    BundleDto archiveBundle(UUID id);
    BundleDto restoreBundle(UUID id);
    void deleteBundle(UUID id);
    byte[] downloadBundle(UUID id);
    
    BundleDto addDocuments(UUID bundleId, List<UUID> documentIds);
    BundleDto removeDocument(UUID bundleId, UUID documentId);
    BundleDto reorderDocuments(UUID bundleId, DocumentReorderRequest request);
}
