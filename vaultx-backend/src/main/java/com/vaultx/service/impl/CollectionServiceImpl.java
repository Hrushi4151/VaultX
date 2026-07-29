package com.vaultx.service.impl;

import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.document.CollectionDto;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.entity.Collection;
import com.vaultx.entity.Document;
import com.vaultx.entity.User;
import com.vaultx.exception.BusinessException;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.DocumentMapper;
import com.vaultx.repository.CollectionRepository;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.CollectionService;
import com.vaultx.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final DocumentMapper documentMapper;
    private final StorageService storageService;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    private Collection getOwnedCollection(UUID id, UUID userId) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", id.toString()));
        if (!collection.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Collection", "id", id.toString());
        }
        return collection;
    }

    private CollectionDto toDto(Collection collection) {
        List<DocumentDto> docs = collection.getDocuments().stream()
                .filter(d -> !d.isDeleted())
                .map(documentMapper::toDto)
                .collect(Collectors.toList());
        return CollectionDto.builder()
                .id(collection.getId())
                .name(collection.getName())
                .description(collection.getDescription())
                .documentCount(docs.size())
                .createdAt(collection.getCreatedAt())
                .documents(docs)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectionDto> getUserCollections() {
        return collectionRepository.findByUserId(getCurrentUser().getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CollectionDto getCollection(UUID id) {
        return toDto(getOwnedCollection(id, getCurrentUser().getId()));
    }

    @Override
    @Transactional
    public CollectionDto createCollection(String name, String description) {
        User user = getCurrentUser();
        if (collectionRepository.findByNameAndUserId(name, user.getId()).isPresent()) {
            throw new BusinessException("A collection with this name already exists");
        }
        Collection collection = Collection.builder()
                .name(name)
                .description(description)
                .user(user)
                .build();
        return toDto(collectionRepository.save(collection));
    }

    @Override
    @Transactional
    public CollectionDto renameCollection(UUID id, String name, String description) {
        User user = getCurrentUser();
        Collection collection = getOwnedCollection(id, user.getId());
        // Check for name conflicts only if the name has actually changed
        if (!collection.getName().equals(name)) {
            if (collectionRepository.findByNameAndUserId(name, user.getId()).isPresent()) {
                throw new BusinessException("A collection with this name already exists");
            }
        }
        collection.setName(name);
        collection.setDescription(description);
        return toDto(collectionRepository.save(collection));
    }

    @Override
    @Transactional
    public void addDocumentsToCollection(UUID collectionId, List<UUID> documentIds) {
        User user = getCurrentUser();
        Collection collection = getOwnedCollection(collectionId, user.getId());
        for (UUID docId : documentIds) {
            Document doc = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document", "id", docId.toString()));
            if (!doc.getOwner().getId().equals(user.getId())) {
                throw new ResourceNotFoundException("Document", "id", docId.toString());
            }
            doc.getCollections().add(collection);
            documentRepository.save(doc);
        }
    }

    @Override
    @Transactional
    public void removeDocumentFromCollection(UUID collectionId, UUID documentId) {
        User user = getCurrentUser();
        Collection collection = getOwnedCollection(collectionId, user.getId());
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId.toString()));
        doc.getCollections().remove(collection);
        documentRepository.save(doc);
    }

    @Override
    @Transactional
    public void deleteCollection(UUID id) {
        Collection collection = getOwnedCollection(id, getCurrentUser().getId());
        // Remove collection from all documents before deleting
        for (Document doc : collection.getDocuments()) {
            doc.getCollections().remove(collection);
            documentRepository.save(doc);
        }
        collectionRepository.delete(collection);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadCollection(UUID id) {
        Collection collection = getOwnedCollection(id, getCurrentUser().getId());
        List<Document> docs = collection.getDocuments().stream()
                .filter(d -> !d.isDeleted())
                .collect(Collectors.toList());

        if (docs.isEmpty()) {
            throw new BusinessException("Collection is empty");
        }

        try {
            java.util.Map<String, Integer> nameCount = new java.util.HashMap<>();
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos)) {
                String folderName = collection.getName().replaceAll("[\\\\/:*?\"<>|]", "_") + "/";
                
                for (Document doc : docs) {
                    String baseName = doc.getDisplayName();
                    int count = nameCount.getOrDefault(baseName, 0);
                    nameCount.put(baseName, count + 1);
                    
                    String entryName = baseName;
                    if (count > 0) {
                        int dotIndex = baseName.lastIndexOf('.');
                        if (dotIndex > 0) {
                            entryName = baseName.substring(0, dotIndex) + " (" + count + ")" + baseName.substring(dotIndex);
                        } else {
                            entryName = baseName + " (" + count + ")";
                        }
                    }

                    java.util.zip.ZipEntry entry = new java.util.zip.ZipEntry(folderName + entryName);
                    zos.putNextEntry(entry);
                    
                    try (java.io.InputStream is = storageService.downloadFile(doc.getBucketName(), doc.getStoragePath())) {
                        is.transferTo(zos);
                    }
                    zos.closeEntry();
                }
            }
            return baos.toByteArray();
        } catch (java.io.IOException e) {
            throw new BusinessException("Failed to create ZIP for collection");
        }
    }
}

