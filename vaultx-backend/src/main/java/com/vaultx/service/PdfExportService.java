package com.vaultx.service;

import com.vaultx.dto.pdf.PdfSettingsDto;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

public interface PdfExportService {
    
    /**
     * High-level orchestration for exporting a Bundle into a final PDF.
     * Fetches documents from MinIO, applies settings, merges, and returns a stream.
     */
    InputStream exportBundle(UUID bundleId) throws Exception;

    /**
     * High-level orchestration for merging arbitrary documents.
     */
    InputStream mergeDocuments(com.vaultx.dto.pdf.PdfMergeRequestDto request) throws Exception;
}
