package com.vaultx.service;

import com.vaultx.dto.ai.AiDocumentAnalysisDto;
import com.vaultx.dto.document.DocumentDto;

import java.util.List;
import java.util.UUID;

public interface AiClassificationService {
    void classifyDocument(UUID documentId);
    AiDocumentAnalysisDto analyzeDocument(UUID documentId);

    AiDocumentAnalysisDto analyzePreview(org.springframework.web.multipart.MultipartFile file);

    DocumentDto applySuggestions(UUID documentId, String suggestedName, String categoryName, String collectionName, List<String> tags, String ocrText);
}
