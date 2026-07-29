package com.vaultx.service;

import com.vaultx.dto.document.CollectionDto;
import java.util.List;
import java.util.UUID;

public interface CollectionService {
    List<CollectionDto> getUserCollections();
    CollectionDto getCollection(UUID id);
    CollectionDto createCollection(String name, String description);
    CollectionDto renameCollection(UUID id, String name, String description);
    void addDocumentsToCollection(UUID collectionId, List<UUID> documentIds);
    void removeDocumentFromCollection(UUID collectionId, UUID documentId);
    void deleteCollection(UUID id);
    byte[] downloadCollection(UUID id);
}
