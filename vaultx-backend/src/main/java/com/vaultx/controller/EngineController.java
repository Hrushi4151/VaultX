package com.vaultx.controller;

import com.vaultx.dto.ai.*;
import com.vaultx.service.AiClassificationService;
import com.vaultx.service.AiInsightsService;
import com.vaultx.service.DuplicateDetectionService;
import com.vaultx.service.OcrEngineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/engine")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Intelligent Engine", description = "Endpoints for OCR, AI Classification, and Duplicate Detection")
public class EngineController {

    private final OcrEngineService ocrEngineService;
    private final AiClassificationService aiClassificationService;
    private final DuplicateDetectionService duplicateDetectionService;
    private final AiInsightsService aiInsightsService;

    @PostMapping("/ocr/process/{documentId}")
    @Operation(summary = "Manually trigger OCR processing for a document")
    public ResponseEntity<Void> processOcr(@PathVariable UUID documentId) {
        try {
            ocrEngineService.processDocument(documentId);
        } catch (Throwable t) {
            log.warn("OCR Processing encountered exception for {}: {}", documentId, t.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/ai/classify/{documentId}")
    @Operation(summary = "Manually trigger AI classification for a document")
    public ResponseEntity<Void> processAiClassification(@PathVariable UUID documentId) {
        try {
            aiClassificationService.classifyDocument(documentId);
        } catch (Throwable t) {
            log.warn("AI Classification encountered exception for {}: {}", documentId, t.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ai/analyze/{documentId}")
    @Operation(summary = "Analyze document with AI and generate smart suggestions")
    public ResponseEntity<AiDocumentAnalysisDto> analyzeDocument(@PathVariable UUID documentId) {
        return ResponseEntity.ok(aiClassificationService.analyzeDocument(documentId));
    }

    @PostMapping("/ai/apply-suggestions/{documentId}")
    @Operation(summary = "Apply AI smart suggestions to a document")
    public ResponseEntity<com.vaultx.dto.document.DocumentDto> applySuggestions(
            @PathVariable UUID documentId,
            @RequestParam(required = false) String suggestedName,
            @RequestParam(required = false) String categoryName,
            @RequestParam(required = false) String collectionName,
            @RequestParam(required = false) List<String> tags) {
        return ResponseEntity.ok(aiClassificationService.applySuggestions(documentId, suggestedName, categoryName, collectionName, tags));
    }

    @GetMapping("/ai/summary")
    @Operation(summary = "Get summary metrics for AI insights")
    public ResponseEntity<AiInsightsSummaryDto> getAiSummary() {
        return ResponseEntity.ok(aiInsightsService.getSummary());
    }

    @GetMapping("/ai/categorized")
    @Operation(summary = "Get AI categorized documents")
    public ResponseEntity<List<SmartCategorizationDto>> getSmartCategorizations() {
        return ResponseEntity.ok(aiInsightsService.getSmartCategorizations());
    }

    @GetMapping("/ai/ocr")
    @Operation(summary = "Get OCR scanned documents")
    public ResponseEntity<List<OcrScanDto>> getOcrScans() {
        return ResponseEntity.ok(aiInsightsService.getOcrScans());
    }

    @GetMapping("/ai/expiring")
    @Operation(summary = "Get expiring documents")
    public ResponseEntity<List<ExpiringDocumentDto>> getExpiringDocuments() {
        return ResponseEntity.ok(aiInsightsService.getExpiringDocuments());
    }

    @GetMapping("/ai/duplicates")
    @Operation(summary = "Get duplicate file groups")
    public ResponseEntity<List<DuplicateGroupDto>> getDuplicateGroups() {
        return ResponseEntity.ok(aiInsightsService.getDuplicateGroups());
    }

    @PostMapping("/ai/expiry/{documentId}")
    @Operation(summary = "Set expiration date for a document")
    public ResponseEntity<Void> setExpiryDate(
            @PathVariable UUID documentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate expiryDate) {
        aiInsightsService.setDocumentExpiry(documentId, expiryDate);
        return ResponseEntity.ok().build();
    }
}
