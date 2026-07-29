package com.vaultx.controller;

import com.vaultx.dto.document.CollectionDto;
import com.vaultx.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor
@Tag(name = "Collection Management", description = "Endpoints for managing user collections")
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping
    @Operation(summary = "Get all collections for the current user")
    public ResponseEntity<List<CollectionDto>> getUserCollections() {
        return ResponseEntity.ok(collectionService.getUserCollections());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single collection with its documents")
    public ResponseEntity<CollectionDto> getCollection(@PathVariable UUID id) {
        return ResponseEntity.ok(collectionService.getCollection(id));
    }

    @PostMapping
    @Operation(summary = "Create a new collection")
    public ResponseEntity<CollectionDto> createCollection(@RequestBody Map<String, String> request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(collectionService.createCollection(request.get("name"), request.get("description")));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Rename or update a collection")
    public ResponseEntity<CollectionDto> renameCollection(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(collectionService.renameCollection(
                id, request.get("name"), request.get("description")));
    }

    @PostMapping("/{id}/documents")
    @Operation(summary = "Add documents to a collection")
    public ResponseEntity<Void> addDocuments(
            @PathVariable UUID id,
            @RequestBody Map<String, List<UUID>> request) {
        collectionService.addDocumentsToCollection(id, request.get("documentIds"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/documents/{documentId}")
    @Operation(summary = "Remove a document from a collection")
    public ResponseEntity<Void> removeDocument(
            @PathVariable UUID id,
            @PathVariable UUID documentId) {
        collectionService.removeDocumentFromCollection(id, documentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Download a collection as a ZIP file")
    public ResponseEntity<org.springframework.core.io.Resource> downloadCollection(@PathVariable UUID id) {
        CollectionDto collection = collectionService.getCollection(id);
        byte[] zipData = collectionService.downloadCollection(id);
        
        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(zipData);
        
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + collection.getName() + ".zip\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/zip")
                .contentLength(zipData.length)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a collection")
    public ResponseEntity<Void> deleteCollection(@PathVariable UUID id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }
}

