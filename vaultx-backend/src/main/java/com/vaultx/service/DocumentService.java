package com.vaultx.service;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.dto.document.DocumentUploadRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

public interface DocumentService {
    DocumentDto uploadDocument(MultipartFile file, DocumentUploadRequest request);
    List<DocumentDto> uploadMultipleDocuments(List<MultipartFile> files, DocumentUploadRequest request);
    
    PagedResponse<DocumentDto> getActiveDocuments(UUID categoryId, Pageable pageable);
    InputStream exportDocuments(UUID categoryId) throws Exception;
    PagedResponse<DocumentDto> getArchivedDocuments(Pageable pageable);
    PagedResponse<DocumentDto> getTrashDocuments(Pageable pageable);
    PagedResponse<DocumentDto> getFavouriteDocuments(Pageable pageable);
    
    DocumentDto getDocumentById(UUID id);
    InputStream downloadDocument(UUID id);
    
    DocumentDto renameDocument(UUID id, String newName);
    DocumentDto updateCategory(UUID id, UUID categoryId);
    DocumentDto toggleFavourite(UUID id);
    DocumentDto archiveDocument(UUID id);
    DocumentDto restoreDocument(UUID id);
    
    void softDeleteDocument(UUID id);
    void permanentDeleteDocument(UUID id);
    
    void emptyTrash();
    void restoreDocuments(List<UUID> documentIds);
    void permanentDeleteDocuments(List<UUID> documentIds);
    
    DocumentDto addTag(UUID documentId, UUID tagId);
    DocumentDto removeTag(UUID documentId, UUID tagId);
    
    DocumentDto addToCollection(UUID documentId, UUID collectionId);
    DocumentDto removeFromCollection(UUID documentId, UUID collectionId);
}
