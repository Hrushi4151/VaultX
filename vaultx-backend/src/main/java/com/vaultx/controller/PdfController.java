package com.vaultx.controller;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.pdf.PdfExportDto;
import com.vaultx.service.PdfExportService;
import com.vaultx.service.PdfProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/pdf")
@RequiredArgsConstructor
@Tag(name = "PDF Toolkit", description = "Endpoints for professional PDF manipulation and exporting")
public class PdfController {

    private final PdfExportService pdfExportService;
    private final PdfProcessingService pdfProcessingService;

    @PostMapping("/bundles/{bundleId}/export")
    @Operation(summary = "Export a smart document bundle to PDF")
    public ResponseEntity<InputStreamResource> exportBundle(@PathVariable UUID bundleId) throws Exception {
        InputStream pdfStream = pdfExportService.exportBundle(bundleId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=VaultX_Bundle_" + bundleId.toString().substring(0,8) + ".pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(pdfStream));
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge multiple documents into a single PDF with custom settings")
    public ResponseEntity<InputStreamResource> mergeDocuments(@RequestBody com.vaultx.dto.pdf.PdfMergeRequestDto request) throws Exception {
        InputStream pdfStream = pdfExportService.mergeDocuments(request);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=VaultX_Merged.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(pdfStream));
    }

    @PostMapping(value = "/protect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Encrypt a PDF file with real password protection and permission flags")
    public ResponseEntity<InputStreamResource> protectPdf(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "userPassword", required = false) String userPassword,
            @RequestParam(value = "ownerPassword", required = false) String ownerPassword,
            @RequestParam(value = "allowPrint", defaultValue = "true") boolean allowPrint,
            @RequestParam(value = "allowCopy", defaultValue = "false") boolean allowCopy,
            @RequestParam(value = "allowEdit", defaultValue = "false") boolean allowEdit
    ) throws Exception {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        
        String ownerKey = (ownerPassword != null && !ownerPassword.trim().isEmpty()) 
                ? ownerPassword.trim() 
                : ((userPassword != null && !userPassword.trim().isEmpty()) ? userPassword.trim() : "VaultXMasterKey");
        String userKey = (userPassword != null && !userPassword.trim().isEmpty()) ? userPassword.trim() : "";

        pdfProcessingService.encryptPdf(
                file.getInputStream(),
                baos,
                ownerKey,
                userKey,
                allowPrint,
                allowCopy,
                allowEdit
        );

        java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(baos.toByteArray());
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Protected_" + file.getOriginalFilename());

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new InputStreamResource(bais));
    }
}
