package com.vaultx.controller;

import com.vaultx.dto.share.PublicShareMetadataDto;
import com.vaultx.service.PublicShareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/public/shares")
@RequiredArgsConstructor
@Tag(name = "Public Shares", description = "Unauthenticated endpoints for accessing shared files")
public class PublicShareController {

    private final PublicShareService publicShareService;

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    @GetMapping("/{token}")
    @Operation(summary = "Get safe metadata for a public share token")
    public ResponseEntity<PublicShareMetadataDto> getMetadata(@PathVariable String token, HttpServletRequest request) {
        String ip = getClientIp(request);
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        return ResponseEntity.ok(publicShareService.getPublicMetadata(token, ip, userAgent));
    }

    @PostMapping("/{token}/verify")
    @Operation(summary = "Verify the password for a protected share link")
    public ResponseEntity<Map<String, Boolean>> verifyPassword(
            @PathVariable String token, 
            @RequestBody Map<String, String> body) {
        boolean isValid = publicShareService.verifyPassword(token, body.get("password"));
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @PostMapping("/{token}/download")
    @Operation(summary = "Download shared file(s), optionally as ZIP")
    public ResponseEntity<InputStreamResource> downloadShare(
            @PathVariable String token,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) throws Exception {
                
        String password = body != null ? body.get("password") : null;
        String ip = getClientIp(request);
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);

        InputStream stream = publicShareService.downloadShare(token, password, ip, userAgent);
        
        HttpHeaders headers = new HttpHeaders();
        // The service should ideally return filename hints, but for simplicity we'll just name it VaultX_Share
        // A single PDF file will technically be downloaded with this generic name, but it will work.
        // If it's a zip (multiple files), we name it .zip
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=VaultX_Share_" + token);
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(stream));
    }

    @PostMapping("/{token}/documents")
    @Operation(summary = "Get the list of documents in a share (requires password if protected)")
    public ResponseEntity<java.util.List<com.vaultx.dto.share.PublicDocumentDto>> getShareDocuments(
            @PathVariable String token,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        String password = body != null ? body.get("password") : null;
        String ip = getClientIp(request);
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);
        return ResponseEntity.ok(publicShareService.getShareDocuments(token, password, ip, userAgent));
    }

    @PostMapping("/{token}/documents/{docId}/download")
    @Operation(summary = "Download a single document from a share")
    public ResponseEntity<InputStreamResource> downloadSingleDocument(
            @PathVariable String token,
            @PathVariable String docId,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) throws Exception {
        String password = body != null ? body.get("password") : null;
        String ip = getClientIp(request);
        String userAgent = request.getHeader(HttpHeaders.USER_AGENT);

        InputStream stream = publicShareService.downloadSingleDocument(token, docId, password, ip, userAgent);
        
        HttpHeaders headers = new HttpHeaders();
        // Fallback name, frontend should specify download filename based on doc data
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=VaultX_Document");
        
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(stream));
    }
}
