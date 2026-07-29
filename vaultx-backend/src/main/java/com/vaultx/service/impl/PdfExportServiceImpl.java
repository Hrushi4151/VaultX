package com.vaultx.service.impl;

import com.vaultx.entity.*;
import com.vaultx.dto.pdf.PdfSettingsDto;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.repository.BundleRepository;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.PdfExportRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.PdfExportService;
import com.vaultx.service.PdfProcessingService;
import com.vaultx.service.StorageService;
import com.vaultx.common.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PdfExportServiceImpl implements PdfExportService {

    private final PdfProcessingService pdfProcessingService;
    private final StorageService storageService;
    private final BundleRepository bundleRepository;
    private final DocumentRepository documentRepository;
    private final PdfExportRepository pdfExportRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public InputStream exportBundle(UUID bundleId) throws Exception {
        User user = getCurrentUser();
        Bundle bundle = bundleRepository.findById(bundleId)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle", "id", bundleId.toString()));

        if (!bundle.getOwner().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Bundle", "id", bundleId.toString());
        }

        // Initialize tracking
        PdfExport pdfExport = PdfExport.builder()
                .exportName(bundle.getName() + ".pdf")
                .owner(user)
                .status("PROCESSING")
                .exportType("BUNDLE_EXPORT")
                .format("PDF")
                .build();
        pdfExport = pdfExportRepository.save(pdfExport);

        try {
            BundleSettings settings = bundle.getSettings();
            List<InputStream> pdfSources = new ArrayList<>();
            List<String> documentTitles = new ArrayList<>();

            // 1. Generate Cover Page if needed
            if (settings != null && settings.isIncludeCoverPage()) {
                InputStream coverPage = pdfProcessingService.generateCoverPage(
                        bundle.getName(), 
                        bundle.getDescription(), 
                        user.getFirstName() + " " + user.getLastName(),
                        bundle.getDocuments().size()
                );
                pdfSources.add(coverPage);
            }

            // Prepare Document streams in order
            List<BundleDocument> sortedDocs = bundle.getDocuments().stream()
                    .sorted(Comparator.comparingInt(BundleDocument::getOrderIndex))
                    .collect(Collectors.toList());

            // 2. Generate TOC if needed
            if (settings != null && settings.isIncludeToc()) {
                for (BundleDocument bd : sortedDocs) {
                    documentTitles.add(bd.getDocument().getDisplayName());
                }
                InputStream toc = pdfProcessingService.generateTableOfContents(documentTitles);
                pdfSources.add(toc);
            }

            // 3. Fetch each document from MinIO
            for (BundleDocument bd : sortedDocs) {
                Document doc = bd.getDocument();
                if (doc.getMimeType().equals("application/pdf")) {
                    pdfSources.add(storageService.downloadFile(doc.getBucketName(), doc.getStoragePath()));
                } else if (doc.getMimeType().startsWith("image/")) {
                    // Convert image to PDF stream in memory
                    ByteArrayOutputStream imagePdfOut = new ByteArrayOutputStream();
                    pdfProcessingService.imagesToPdf(List.of(storageService.downloadFile(doc.getBucketName(), doc.getStoragePath())), imagePdfOut);
                    pdfSources.add(new ByteArrayInputStream(imagePdfOut.toByteArray()));
                }
            }

            // 4. Merge all sources
            ByteArrayOutputStream mergedOut = new ByteArrayOutputStream();
            pdfProcessingService.mergePdfs(pdfSources, mergedOut);
            byte[] finalPdfBytes = mergedOut.toByteArray();

            // 5. Apply Page Numbers if needed
            if (settings != null && settings.isIncludePageNumbers()) {
                ByteArrayOutputStream pagedOut = new ByteArrayOutputStream();
                pdfProcessingService.addPageNumbers(new ByteArrayInputStream(finalPdfBytes), pagedOut, "BOTTOM_CENTER");
                finalPdfBytes = pagedOut.toByteArray();
            }

            // 6. Apply Watermark if needed
            if (settings != null && settings.getWatermarkText() != null && !settings.getWatermarkText().isEmpty()) {
                ByteArrayOutputStream watermarkedOut = new ByteArrayOutputStream();
                pdfProcessingService.addWatermark(new ByteArrayInputStream(finalPdfBytes), watermarkedOut, settings.getWatermarkText());
                finalPdfBytes = watermarkedOut.toByteArray();
            }

            // 7. Encrypt if needed (if passwords were a feature in BundleSettings, we'd do it here. The prompt implies this is part of the general PDF export settings later).

            // Update success tracking
            pdfExport.setStatus("SUCCESS");
            pdfExport.setFileSize((long) finalPdfBytes.length);
            pdfExport.setCompletedAt(LocalDateTime.now());
            pdfExportRepository.save(pdfExport);

            return new ByteArrayInputStream(finalPdfBytes);

        } catch (Exception e) {
            log.error("Failed to export bundle {}", bundleId, e);
            pdfExport.setStatus("FAILED");
            pdfExport.setErrorMessage(e.getMessage());
            pdfExport.setCompletedAt(LocalDateTime.now());
            pdfExportRepository.save(pdfExport);
            throw e;
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public InputStream mergeDocuments(com.vaultx.dto.pdf.PdfMergeRequestDto request) throws Exception {
        User user = getCurrentUser();
        
        List<Document> docs = new ArrayList<>();
        for (UUID id : request.getDocumentIds()) {
            Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
            if (!doc.getOwner().getId().equals(user.getId())) {
                 throw new ResourceNotFoundException("Document", "id", id.toString());
            }
            docs.add(doc);
        }

        PdfExport pdfExport = PdfExport.builder()
                .exportName("Merged_Export_" + System.currentTimeMillis() + ".pdf")
                .owner(user)
                .status("PROCESSING")
                .exportType("MERGE")
                .format("PDF")
                .build();
        pdfExport = pdfExportRepository.save(pdfExport);

        try {
            List<InputStream> pdfSources = new ArrayList<>();
            List<String> documentTitles = new ArrayList<>();

            if (request.isIncludeCoverPage()) {
                InputStream coverPage = pdfProcessingService.generateCoverPage(
                        request.getCoverTitle(), 
                        request.getCoverDescription(), 
                        user.getFirstName() + " " + user.getLastName(),
                        docs.size()
                );
                pdfSources.add(coverPage);
            }

            if (request.isIncludeToc()) {
                for (Document doc : docs) {
                    documentTitles.add(doc.getDisplayName());
                }
                InputStream toc = pdfProcessingService.generateTableOfContents(documentTitles);
                pdfSources.add(toc);
            }

            for (Document doc : docs) {
                if (doc.getMimeType().equals("application/pdf")) {
                    pdfSources.add(storageService.downloadFile(doc.getBucketName(), doc.getStoragePath()));
                } else if (doc.getMimeType().startsWith("image/")) {
                    ByteArrayOutputStream imagePdfOut = new ByteArrayOutputStream();
                    pdfProcessingService.imagesToPdf(List.of(storageService.downloadFile(doc.getBucketName(), doc.getStoragePath())), imagePdfOut);
                    pdfSources.add(new ByteArrayInputStream(imagePdfOut.toByteArray()));
                }
            }

            ByteArrayOutputStream mergedOut = new ByteArrayOutputStream();
            pdfProcessingService.mergePdfs(pdfSources, mergedOut);
            byte[] finalPdfBytes = mergedOut.toByteArray();

            if (request.isIncludePageNumbers()) {
                ByteArrayOutputStream pagedOut = new ByteArrayOutputStream();
                String pos = request.getPageNumberPosition() != null ? request.getPageNumberPosition() : "BOTTOM_CENTER";
                pdfProcessingService.addPageNumbers(new ByteArrayInputStream(finalPdfBytes), pagedOut, pos);
                finalPdfBytes = pagedOut.toByteArray();
            }

            if (request.getWatermarkText() != null && !request.getWatermarkText().isEmpty()) {
                ByteArrayOutputStream watermarkedOut = new ByteArrayOutputStream();
                pdfProcessingService.addWatermark(new ByteArrayInputStream(finalPdfBytes), watermarkedOut, request.getWatermarkText());
                finalPdfBytes = watermarkedOut.toByteArray();
            }

            if (request.getSignatureImageBase64() != null && !request.getSignatureImageBase64().isEmpty()) {
                ByteArrayOutputStream signedOut = new ByteArrayOutputStream();
                String pos = request.getWatermarkPosition() != null ? request.getWatermarkPosition() : "BOTTOM_RIGHT";
                pdfProcessingService.addSignatureOverlay(new ByteArrayInputStream(finalPdfBytes), signedOut, request.getSignatureImageBase64(), pos);
                finalPdfBytes = signedOut.toByteArray();
            }

            if ((request.getOwnerPassword() != null && !request.getOwnerPassword().isEmpty()) || 
                (request.getUserPassword() != null && !request.getUserPassword().isEmpty())) {
                ByteArrayOutputStream encryptedOut = new ByteArrayOutputStream();
                pdfProcessingService.encryptPdf(
                    new ByteArrayInputStream(finalPdfBytes), 
                    encryptedOut, 
                    request.getOwnerPassword(), 
                    request.getUserPassword(),
                    request.isAllowPrint(),
                    request.isAllowCopy(),
                    false
                );
                finalPdfBytes = encryptedOut.toByteArray();
            }

            pdfExport.setStatus("SUCCESS");
            pdfExport.setFileSize((long) finalPdfBytes.length);
            pdfExport.setCompletedAt(LocalDateTime.now());
            pdfExportRepository.save(pdfExport);

            return new ByteArrayInputStream(finalPdfBytes);

        } catch (Exception e) {
            log.error("Failed to merge documents", e);
            pdfExport.setStatus("FAILED");
            pdfExport.setErrorMessage(e.getMessage());
            pdfExport.setCompletedAt(LocalDateTime.now());
            pdfExportRepository.save(pdfExport);
            throw e;
        }
    }
}
