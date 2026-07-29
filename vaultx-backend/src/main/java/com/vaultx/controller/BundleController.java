package com.vaultx.controller;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.bundle.BundleCreateRequest;
import com.vaultx.dto.bundle.BundleUpdateRequest;
import com.vaultx.dto.bundle.BundleDto;
import com.vaultx.dto.bundle.DocumentReorderRequest;
import com.vaultx.service.BundleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bundles")
@RequiredArgsConstructor
@Tag(name = "Smart Document Bundles", description = "Endpoints for managing document bundles (Student Toolkit)")
public class BundleController {

    private final BundleService bundleService;

    @PostMapping
    @Operation(summary = "Create a new bundle")
    public ResponseEntity<BundleDto> createBundle(@Valid @RequestBody BundleCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bundleService.createBundle(request));
    }

    @GetMapping
    @Operation(summary = "Get user bundles with pagination")
    public ResponseEntity<PagedResponse<BundleDto>> getUserBundles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sort,
            @RequestParam(defaultValue = "desc") String dir) {
        Sort.Direction direction = dir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        return ResponseEntity.ok(bundleService.getUserBundles(PageRequest.of(page, size, Sort.by(direction, sort))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get bundle by ID")
    public ResponseEntity<BundleDto> getBundleById(@PathVariable UUID id) {
        return ResponseEntity.ok(bundleService.getBundleById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update bundle details")
    public ResponseEntity<BundleDto> updateBundle(@PathVariable UUID id, @Valid @RequestBody BundleUpdateRequest request) {
        return ResponseEntity.ok(bundleService.updateBundle(id, request));
    }

    @PostMapping("/{id}/duplicate")
    @Operation(summary = "Duplicate a bundle")
    public ResponseEntity<BundleDto> duplicateBundle(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bundleService.duplicateBundle(id));
    }

    @PostMapping("/{id}/favorite")
    @Operation(summary = "Toggle favorite status")
    public ResponseEntity<BundleDto> toggleFavorite(@PathVariable UUID id) {
        return ResponseEntity.ok(bundleService.toggleFavourite(id));
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a bundle")
    public ResponseEntity<BundleDto> archiveBundle(@PathVariable UUID id) {
        return ResponseEntity.ok(bundleService.archiveBundle(id));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore an archived bundle")
    public ResponseEntity<BundleDto> restoreBundle(@PathVariable UUID id) {
        return ResponseEntity.ok(bundleService.restoreBundle(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently delete a bundle")
    public ResponseEntity<Void> deleteBundle(@PathVariable UUID id) {
        bundleService.deleteBundle(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/documents")
    @Operation(summary = "Add documents to a bundle")
    public ResponseEntity<BundleDto> addDocuments(@PathVariable UUID id, @RequestBody Map<String, List<UUID>> request) {
        return ResponseEntity.ok(bundleService.addDocuments(id, request.get("documentIds")));
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @Operation(summary = "Remove a document from a bundle")
    public ResponseEntity<BundleDto> removeDocument(@PathVariable UUID id, @PathVariable UUID documentId) {
        return ResponseEntity.ok(bundleService.removeDocument(id, documentId));
    }

    @PutMapping("/{id}/reorder")
    @Operation(summary = "Reorder documents in a bundle")
    public ResponseEntity<BundleDto> reorderDocuments(@PathVariable UUID id, @Valid @RequestBody DocumentReorderRequest request) {
        return ResponseEntity.ok(bundleService.reorderDocuments(id, request));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a bundle as a ZIP file")
    public ResponseEntity<org.springframework.core.io.ByteArrayResource> downloadBundle(@PathVariable UUID id) {
        byte[] zipData = bundleService.downloadBundle(id);
        BundleDto bundle = bundleService.getBundleById(id);
        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(zipData);

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + bundle.getName() + ".zip\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/zip")
                .contentLength(zipData.length)
                .body(resource);
    }
}
