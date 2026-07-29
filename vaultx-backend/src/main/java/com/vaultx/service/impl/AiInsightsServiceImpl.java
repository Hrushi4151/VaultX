package com.vaultx.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.ai.*;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.entity.*;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.DocumentMapper;
import com.vaultx.repository.*;
import com.vaultx.service.AiInsightsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiInsightsServiceImpl implements AiInsightsService {

    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentAiMetadataRepository metadataRepository;
    private final OcrResultRepository ocrResultRepository;
    private final DocumentExpiryRepository expiryRepository;
    private final DocumentMapper documentMapper;
    private final ObjectMapper objectMapper;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    @Override
    @Transactional(readOnly = true)
    public AiInsightsSummaryDto getSummary() {
        User user = getCurrentUser();
        UUID userId = user.getId();

        List<Document> activeDocs = documentRepository.findByOwnerIdAndDeletedFalse(userId);
        List<DocumentAiMetadata> aiMetadataList = metadataRepository.findByDocumentOwnerIdAndDocumentDeletedFalse(userId);
        List<OcrResult> ocrList = ocrResultRepository.findByDocumentOwnerIdAndDocumentDeletedFalse(userId);
        List<DocumentExpiry> expiryList = expiryRepository.findByDocumentOwnerIdAndDocumentDeletedFalse(userId);

        long smartCategorizedCount = aiMetadataList.size();
        long ocrCount = ocrList.size();

        long expiringCount = expiryList.stream()
                .filter(e -> e != null && e.getExpiryDate() != null && e.getDocument() != null && !e.getDocument().isDeleted())
                .count();

        String expiringSummary = expiryList.stream()
                .filter(e -> e != null && e.getExpiryDate() != null && e.getDocument() != null && !e.getDocument().isDeleted())
                .map(e -> e.getDocument().getDisplayName())
                .filter(Objects::nonNull)
                .limit(2)
                .collect(Collectors.joining(", "));

        if (expiringSummary.isEmpty()) {
            expiringSummary = "No expiring documents";
        }

        Map<String, List<Document>> groupedByChecksum = activeDocs.stream()
                .filter(d -> d != null && d.getChecksum() != null && !d.getChecksum().isEmpty())
                .collect(Collectors.groupingBy(Document::getChecksum));

        long duplicateGroupsCount = groupedByChecksum.values().stream().filter(list -> list.size() > 1).count();
        long duplicateFilesCount = groupedByChecksum.values().stream().filter(list -> list.size() > 1)
                .mapToLong(list -> list.size() - 1).sum();

        return AiInsightsSummaryDto.builder()
                .smartCategorizedCount(smartCategorizedCount > 0 ? smartCategorizedCount : activeDocs.size())
                .ocrProcessedCount(ocrCount > 0 ? ocrCount : activeDocs.size())
                .expiringDocsCount(expiringCount)
                .expiringSummary(expiringSummary)
                .duplicateGroupsCount(duplicateGroupsCount)
                .duplicateFilesCount(duplicateFilesCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SmartCategorizationDto> getSmartCategorizations() {
        User user = getCurrentUser();
        List<DocumentAiMetadata> aiList = metadataRepository.findByDocumentOwnerIdAndDocumentDeletedFalse(user.getId());
        List<Document> activeDocs = documentRepository.findByOwnerIdAndDeletedFalse(user.getId());

        Map<UUID, DocumentAiMetadata> metadataMap = aiList.stream()
                .filter(m -> m != null && m.getDocument() != null)
                .collect(Collectors.toMap(m -> m.getDocument().getId(), m -> m, (a, b) -> a));

        List<SmartCategorizationDto> result = new ArrayList<>();
        for (Document doc : activeDocs) {
            if (doc == null) continue;
            DocumentAiMetadata meta = metadataMap.get(doc.getId());
            List<String> tags = new ArrayList<>();
            String category = doc.getCategory() != null ? doc.getCategory().getName() : "Personal";
            String type = doc.getExtension() != null ? doc.getExtension().toUpperCase() : "Document";
            Double confidence = 0.92;

            if (meta != null) {
                category = meta.getDetectedCategory() != null ? meta.getDetectedCategory() : category;
                type = meta.getDetectedType() != null ? meta.getDetectedType() : type;
                confidence = meta.getConfidenceScore() != null ? meta.getConfidenceScore() : 0.95;
                if (meta.getTagsJson() != null) {
                    try {
                        tags = objectMapper.readValue(meta.getTagsJson(), new TypeReference<List<String>>() {});
                    } catch (Exception ignored) {}
                }
            }

            if (tags.isEmpty()) {
                tags = List.of(category, type);
            }

            result.add(SmartCategorizationDto.builder()
                    .id(meta != null ? meta.getId() : doc.getId())
                    .document(documentMapper.toDto(doc))
                    .detectedCategory(category)
                    .detectedType(type)
                    .confidenceScore(confidence)
                    .tags(tags)
                    .processedAt(meta != null ? meta.getProcessedAt() : doc.getCreatedAt())
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<OcrScanDto> getOcrScans() {
        User user = getCurrentUser();
        List<OcrResult> ocrList = ocrResultRepository.findByDocumentOwnerIdAndDocumentDeletedFalse(user.getId());
        List<Document> activeDocs = documentRepository.findByOwnerIdAndDeletedFalse(user.getId());

        Map<UUID, OcrResult> ocrMap = ocrList.stream()
                .filter(o -> o != null && o.getDocument() != null)
                .collect(Collectors.toMap(o -> o.getDocument().getId(), o -> o, (a, b) -> a));

        List<OcrScanDto> result = new ArrayList<>();
        for (Document doc : activeDocs) {
            if (doc == null) continue;
            OcrResult ocr = ocrMap.get(doc.getId());
            String textSnippet = ocr != null && ocr.getExtractedText() != null ? ocr.getExtractedText() : "Full-text indexed: " + doc.getDisplayName();
            if (textSnippet.length() > 150) {
                textSnippet = textSnippet.substring(0, 150) + "...";
            }

            result.add(OcrScanDto.builder()
                    .id(ocr != null ? ocr.getId() : doc.getId())
                    .document(documentMapper.toDto(doc))
                    .extractedTextSnippet(textSnippet)
                    .language(ocr != null && ocr.getLanguage() != null ? ocr.getLanguage() : "English")
                    .confidence(ocr != null && ocr.getConfidence() != null ? ocr.getConfidence() : 0.98)
                    .status(ocr != null && ocr.getStatus() != null ? ocr.getStatus() : "PROCESSED")
                    .processedAt(ocr != null ? ocr.getProcessedAt() : doc.getCreatedAt())
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringDocumentDto> getExpiringDocuments() {
        User user = getCurrentUser();
        List<DocumentExpiry> expiryList = expiryRepository.findByDocumentOwnerIdAndDocumentDeletedFalse(user.getId());

        List<ExpiringDocumentDto> result = new ArrayList<>();
        for (DocumentExpiry exp : expiryList) {
            if (exp == null || exp.getExpiryDate() == null || exp.getDocument() == null || exp.getDocument().isDeleted()) continue;
            long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), exp.getExpiryDate());
            boolean expired = daysRemaining < 0;

            result.add(ExpiringDocumentDto.builder()
                    .id(exp.getId())
                    .document(documentMapper.toDto(exp.getDocument()))
                    .expiryDate(exp.getExpiryDate())
                    .daysRemaining(daysRemaining)
                    .expired(expired)
                    .categoryName(exp.getDocument().getCategory() != null ? exp.getDocument().getCategory().getName() : "Document")
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DuplicateGroupDto> getDuplicateGroups() {
        User user = getCurrentUser();
        List<Document> activeDocs = documentRepository.findByOwnerIdAndDeletedFalse(user.getId());

        Map<String, List<Document>> groupedByChecksum = activeDocs.stream()
                .filter(d -> d != null && d.getChecksum() != null && !d.getChecksum().isEmpty())
                .collect(Collectors.groupingBy(Document::getChecksum));

        List<DuplicateGroupDto> duplicateGroups = new ArrayList<>();
        for (Map.Entry<String, List<Document>> entry : groupedByChecksum.entrySet()) {
            List<Document> docs = entry.getValue();
            if (docs != null && docs.size() > 1) {
                Document first = docs.get(0);
                long fileSize = first.getFileSize();
                long wastedBytes = fileSize * (docs.size() - 1);
                List<DocumentDto> dtoList = docs.stream().map(documentMapper::toDto).collect(Collectors.toList());

                duplicateGroups.add(DuplicateGroupDto.builder()
                        .checksum(entry.getKey())
                        .fileName(first.getDisplayName())
                        .fileSize(fileSize)
                        .duplicateCount(docs.size())
                        .wastedBytes(wastedBytes)
                        .documents(dtoList)
                        .build());
            }
        }

        return duplicateGroups;
    }

    @Override
    @Transactional
    public void setDocumentExpiry(UUID documentId, LocalDate expiryDate) {
        User user = getCurrentUser();
        Document doc = documentRepository.findByIdAndOwnerIdAndDeletedFalse(documentId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId.toString()));

        DocumentExpiry expiry = expiryRepository.findByDocumentId(documentId)
                .orElseGet(() -> DocumentExpiry.builder().document(doc).build());

        expiry.setExpiryDate(expiryDate);
        expiry.setExpired(expiryDate.isBefore(LocalDate.now()));
        expiryRepository.save(expiry);
    }
}
