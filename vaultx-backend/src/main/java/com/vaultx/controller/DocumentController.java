package com.vaultx.controller;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.dto.document.DocumentUploadRequest;
import com.vaultx.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Document Management", description = "Endpoints for documents")
@PreAuthorize("hasRole('USER')")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a single document")
    public ResponseEntity<DocumentDto> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestPart("metadata") DocumentUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.uploadDocument(file, request));
    }

    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload multiple documents")
    public ResponseEntity<List<DocumentDto>> uploadMultipleDocuments(
            @RequestPart("files") List<MultipartFile> files,
            @RequestPart("metadata") DocumentUploadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.uploadMultipleDocuments(files, request));
    }

    @GetMapping
    @Operation(summary = "Get active documents with pagination and sorting")
    public ResponseEntity<PagedResponse<DocumentDto>> getActiveDocuments(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sort,
            @RequestParam(defaultValue = "desc") String dir) {
        Sort.Direction direction = dir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        return ResponseEntity.ok(documentService.getActiveDocuments(categoryId, PageRequest.of(page, size, Sort.by(direction, sort))));
    }

    @GetMapping("/export")
    @Operation(summary = "Export documents as ZIP by category")
    public ResponseEntity<Resource> exportDocuments(@RequestParam(required = false) UUID categoryId) throws Exception {
        InputStream is = documentService.exportDocuments(categoryId);
        String filename = categoryId != null ? "category_" + categoryId + ".zip" : "all_documents.zip";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(new InputStreamResource(is));
    }

    @GetMapping("/trash")
    @Operation(summary = "Get documents in trash")
    public ResponseEntity<PagedResponse<DocumentDto>> getTrashDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(documentService.getTrashDocuments(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))));
    }

    @GetMapping("/favourite")
    @Operation(summary = "Get favourite documents")
    public ResponseEntity<PagedResponse<DocumentDto>> getFavouriteDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(documentService.getFavouriteDocuments(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get document by ID")
    public ResponseEntity<DocumentDto> getDocumentById(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.getDocumentById(id));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a document")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID id) {
        DocumentDto doc = documentService.getDocumentById(id);
        InputStream is = documentService.downloadDocument(id);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getDisplayName() + "\"")
                .contentType(MediaType.parseMediaType(doc.getMimeType()))
                .body(new InputStreamResource(is));
    }

    @PutMapping("/{id}/rename")
    @Operation(summary = "Rename a document")
    public ResponseEntity<DocumentDto> renameDocument(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(documentService.renameDocument(id, request.get("name")));
    }

    @PutMapping("/{id}/category")
    @Operation(summary = "Change document category")
    public ResponseEntity<DocumentDto> updateCategory(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(documentService.updateCategory(id, UUID.fromString(request.get("categoryId"))));
    }

    @PostMapping("/{id}/favourite")
    @Operation(summary = "Toggle favourite status")
    public ResponseEntity<DocumentDto> toggleFavourite(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.toggleFavourite(id));
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a document")
    public ResponseEntity<DocumentDto> archiveDocument(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.archiveDocument(id));
    }

    @PostMapping("/{id}/restore")
    @Operation(summary = "Restore a document from trash or archive")
    public ResponseEntity<DocumentDto> restoreDocument(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.restoreDocument(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete a document (move to trash)")
    public ResponseEntity<Void> softDeleteDocument(@PathVariable UUID id) {
        documentService.softDeleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Permanently delete a document")
    public ResponseEntity<Void> permanentDeleteDocument(@PathVariable UUID id) {
        documentService.permanentDeleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/trash/empty")
    @Operation(summary = "Permanently delete all documents in trash")
    public ResponseEntity<Void> emptyTrash() {
        documentService.emptyTrash();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/trash/restore-batch")
    @Operation(summary = "Restore multiple documents")
    public ResponseEntity<Void> restoreDocuments(@RequestBody List<UUID> documentIds) {
        documentService.restoreDocuments(documentIds);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/trash/permanent-batch")
    @Operation(summary = "Permanently delete multiple documents")
    public ResponseEntity<Void> permanentDeleteDocuments(@RequestBody List<UUID> documentIds) {
        documentService.permanentDeleteDocuments(documentIds);
        return ResponseEntity.noContent().build();
    }
}
