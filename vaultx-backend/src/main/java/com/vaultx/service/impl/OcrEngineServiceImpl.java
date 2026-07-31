package com.vaultx.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vaultx.entity.Document;
import com.vaultx.entity.OcrResult;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.OcrResultRepository;
import com.vaultx.service.OcrEngineService;
import com.vaultx.service.AiClassificationService;
import com.vaultx.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronization;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrEngineServiceImpl implements OcrEngineService {

    private final DocumentRepository documentRepository;
    private final OcrResultRepository ocrResultRepository;
    private final StorageService storageService;
    private final ObjectMapper objectMapper;
    private final AiClassificationService aiClassificationService;

    @Value("${vaultx.ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    @Override
    @Transactional
    public void processDocument(UUID documentId) {
        log.info("Starting OCR processing for document: {}", documentId);

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return;

        OcrResult result = ocrResultRepository.findFirstByDocumentIdOrderByProcessedAtDesc(documentId).orElse(
                OcrResult.builder().document(doc).status("PENDING").build()
        );

        try {
            String extractedText = "";

            log.info("Sending document {} to Python AI Service for OCR extraction", documentId);
            extractedText = tryPythonAiOcr(doc);
            
            log.info("--- RECEIVED OCR TEXT FROM PYTHON ---");
            log.info(extractedText);
            log.info("-------------------------------------");

            result.setExtractedText(extractedText);
            result.setStatus("COMPLETED");
            result.setConfidence(92.0);

        } catch (Throwable t) {
            log.error("OCR Failed for document {}", documentId, t);
            result.setStatus("FAILED");
            result.setExtractedText("[OCR processing failed for: " + doc.getDisplayName() + "]");
            result.setConfidence(0.0);
        } finally {
            result.setProcessedAt(LocalDateTime.now());
            ocrResultRepository.save(result);
            
            // Trigger AI Classification after OCR finishes, but MUST be after the transaction commits
            // to avoid a race condition where the AI thread can't see the saved OCR text.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            aiClassificationService.classifyDocument(documentId);
                        } catch (Exception e) {
                            log.error("Failed to trigger AI Classification after OCR for document {}", documentId, e);
                        }
                    }
                });
            } else {
                try {
                    aiClassificationService.classifyDocument(documentId);
                } catch (Exception e) {
                    log.error("Failed to trigger AI Classification after OCR for document {}", documentId, e);
                }
            }
        }
    }

    /**
     * Uses the local Python AI Microservice to extract text from an image.
     */
    private String tryPythonAiOcr(Document doc) {
        try (InputStream is = storageService.downloadFile(doc.getBucketName(), doc.getStoragePath())) {
            byte[] fileBytes = is.readAllBytes();
            String mimeType = doc.getMimeType() != null ? doc.getMimeType() : "image/jpeg";
            String filename = doc.getOriginalFilename() != null ? doc.getOriginalFilename() : "image.jpg";
            
            log.info("tryPythonAiOcr: Reading file {} ({}). Byte length: {}", filename, mimeType, fileBytes.length);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            
            // Create a custom ByteArrayResource with a filename so the server recognizes it as a file upload
            org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return filename;
                }
            };
            
            body.add("file", resource);

            HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            String url = aiServiceUrl + "/api/v1/ai/ocr";

            log.info("Sending image to Python AI Service for OCR: {}", url);
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, requestEntity, JsonNode.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode responseBody = response.getBody();
                if (responseBody.has("success") && responseBody.get("success").asBoolean()) {
                    String extractedText = responseBody.path("text").asText();
                    if (extractedText != null && !extractedText.trim().isEmpty()) {
                        log.info("Python AI Service extracted {} chars from document {}", extractedText.length(), doc.getId());
                        return extractedText;
                    }
                }
            }
            
            log.warn("Python AI Service returned empty or unsuccessful result for document {}", doc.getId());
            return "[OCR failed: AI Service returned empty text]";

        } catch (org.springframework.web.client.HttpClientErrorException | org.springframework.web.client.HttpServerErrorException e) {
            log.error("Python AI Service error for document {}: {} - {}", doc.getId(), e.getStatusCode(), e.getResponseBodyAsString());
            return "[OCR failed: AI Service returned an error]";
        } catch (Exception e) {
            log.error("Could not read document file or communicate with AI service {}: {}", doc.getId(), e.getMessage());
            return "[OCR failed: Internal communication error]";
        }
    }

    @Override
    public void reprocessDocument(UUID documentId) {
        processDocument(documentId);
    }
}

