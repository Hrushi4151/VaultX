package com.vaultx.service.impl;

import com.vaultx.common.PagedResponse;
import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.dto.document.DocumentUploadRequest;
import com.vaultx.entity.*;
import com.vaultx.exception.BusinessException;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.DocumentMapper;
import com.vaultx.repository.*;
import com.vaultx.service.DocumentActivityService;
import com.vaultx.service.DocumentService;
import com.vaultx.service.StorageService;
import com.vaultx.service.VirusScanService;
import com.vaultx.service.OcrEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final CollectionRepository collectionRepository;
    private final BundleDocumentRepository bundleDocumentRepository;
    private final UserRepository userRepository;
    
    private final StorageService storageService;
    private final VirusScanService virusScanService;
    private final DocumentActivityService activityService;
    private final SecurityUtils securityUtils;
    private final DocumentMapper documentMapper;
    private final OcrEngineService ocrEngineService;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${vaultx.minio.bucket-name}")
    private String defaultBucketName;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    private String calculateChecksum(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] byteArray = new byte[8192];
            int bytesCount;
            while ((bytesCount = is.read(byteArray)) != -1) {
                digest.update(byteArray, 0, bytesCount);
            }
            byte[] bytes = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new BusinessException("Failed to calculate file checksum");
        }
    }

    @Override
    @Transactional
    public DocumentDto uploadDocument(MultipartFile file, DocumentUploadRequest request) {
        User user = getCurrentUser();
        
        // 1. Virus Scan
        try (InputStream is = file.getInputStream()) {
            if (!virusScanService.isClean(is)) {
                throw new BusinessException("VIRUS_DETECTED", "File rejected by virus scan");
            }
        } catch (Exception e) {
            if (e instanceof BusinessException) throw (BusinessException) e;
            throw new BusinessException("Error during virus scan");
        }

        // 2. Validate Type & Size (Size is already handled by Spring max-file-size)
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) originalFilename = "unnamed_file";
        String extension = FilenameUtils.getExtension(originalFilename).toLowerCase();
        
        List<String> allowedExtensions = List.of("pdf", "doc", "docx", "txt", "png", "jpg", "jpeg");
        if (!allowedExtensions.contains(extension)) {
            throw new BusinessException("INVALID_EXTENSION", "File extension '." + extension + "' is not supported.");
        }
        
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        if (mimeType.contains("javascript") || mimeType.contains("exe") || mimeType.contains("sh")) {
             throw new BusinessException("INVALID_MIME_TYPE", "Executable or script files are not allowed.");
        }
        
        // 3. Generate Checksum
        String checksum = calculateChecksum(file);

        // 4. Prepare Metadata
        String storedFilename = UUID.randomUUID().toString() + "." + extension;
        
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId().toString()));
        }

        Document document = Document.builder()
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .displayName(originalFilename)
                .description(request.getDescription())
                .category(category)
                .mimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .extension(extension)
                .fileSize(file.getSize())
                .checksum(checksum)
                .storagePath(user.getId().toString() + "/" + storedFilename)
                .bucketName(defaultBucketName)
                .owner(user)
                .build();

        // Add Tags
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            List<Tag> tags = tagRepository.findAllById(request.getTagIds());
            tags.stream().filter(t -> t.getUser().getId().equals(user.getId())).forEach(document.getTags()::add);
        }

        // Add Collections
        if (request.getCollectionIds() != null && !request.getCollectionIds().isEmpty()) {
            List<Collection> collections = collectionRepository.findAllById(request.getCollectionIds());
            collections.stream().filter(c -> c.getUser().getId().equals(user.getId())).forEach(document.getCollections()::add);
        }

        // 5. Upload to MinIO
        try (InputStream is = file.getInputStream()) {
            storageService.uploadFile(defaultBucketName, document.getStoragePath(), is, document.getMimeType());
        } catch (Exception e) {
            throw new BusinessException("Failed to read file stream for upload");
        }

        // 6. Save Entity & Log Activity
        Document savedDocument = documentRepository.save(document);
        activityService.logActivity(savedDocument, user, "UPLOAD", "Uploaded document: " + originalFilename);

        // Trigger OCR engine (which will subsequently trigger AI Classification)
        try {
            ocrEngineService.processDocument(savedDocument.getId());
        } catch (Exception e) {
            log.error("Failed to queue document {} for OCR processing", savedDocument.getId(), e);
        }

        return documentMapper.toDto(savedDocument);
    }

    @Override
    @Transactional
    public List<DocumentDto> uploadMultipleDocuments(List<MultipartFile> files, DocumentUploadRequest request) {
        List<DocumentDto> result = new ArrayList<>();
        for (MultipartFile file : files) {
            result.add(uploadDocument(file, request));
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto> getActiveDocuments(UUID categoryId, Pageable pageable) {
        User user = getCurrentUser();
        Page<Document> page;
        if (categoryId != null) {
            page = documentRepository.findByOwnerIdAndCategoryIdAndDeletedFalse(user.getId(), categoryId, pageable);
        } else {
            page = documentRepository.findByOwnerIdAndDeletedFalse(user.getId(), pageable);
        }
        return new PagedResponse<>(page.map(documentMapper::toDto));
    }
    
    @Override
    @Transactional(readOnly = true)
    public InputStream exportDocuments(UUID categoryId) throws Exception {
        User user = getCurrentUser();
        List<Document> documents;
        if (categoryId != null) {
            documents = documentRepository.findByOwnerIdAndCategoryIdAndDeletedFalse(user.getId(), categoryId);
        } else {
            documents = documentRepository.findByOwnerIdAndDeletedFalse(user.getId());
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos)) {
            for (Document doc : documents) {
                java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(doc.getDisplayName());
                zos.putNextEntry(zipEntry);
                try (InputStream is = storageService.downloadFile(doc.getBucketName(), doc.getStoragePath())) {
                    byte[] buffer = new byte[1024];
                    int len;
                    while ((len = is.read(buffer)) > 0) {
                        zos.write(buffer, 0, len);
                    }
                }
                zos.closeEntry();
            }
        }
        
        return new ByteArrayInputStream(baos.toByteArray());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto> getArchivedDocuments(Pageable pageable) {
        User user = getCurrentUser();
        Page<Document> page = documentRepository.findByOwnerIdAndArchivedTrueAndDeletedFalse(user.getId(), pageable);
        return new PagedResponse<>(page.map(documentMapper::toDto));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto> getTrashDocuments(Pageable pageable) {
        User user = getCurrentUser();
        Page<Document> page = documentRepository.findByOwnerIdAndDeletedTrue(user.getId(), pageable);
        return new PagedResponse<>(page.map(documentMapper::toDto));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DocumentDto> getFavouriteDocuments(Pageable pageable) {
        User user = getCurrentUser();
        Page<Document> page = documentRepository.findByOwnerIdAndFavouriteTrueAndDeletedFalse(user.getId(), pageable);
        return new PagedResponse<>(page.map(documentMapper::toDto));
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto getDocumentById(UUID id) {
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(id, getCurrentUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        return documentMapper.toDto(document);
    }

    @Override
    @Transactional(readOnly = true)
    public InputStream downloadDocument(UUID id) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        activityService.logActivity(document, user, "DOWNLOAD", "Downloaded document");
        return storageService.downloadFile(document.getBucketName(), document.getStoragePath());
    }

    @Override
    @Transactional
    public DocumentDto renameDocument(UUID id, String newName) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        String uniqueName = getUniqueName(user.getId(), newName, id);
        document.setDisplayName(uniqueName);
        activityService.logActivity(document, user, "RENAME", "Renamed to " + uniqueName);
        return documentMapper.toDto(documentRepository.save(document));
    }

    private String getUniqueName(UUID ownerId, String targetName, UUID currentDocId) {
        if (targetName == null || targetName.trim().isEmpty()) return "Untitled_Document";
        String cleanName = targetName.trim();
        if (!documentRepository.existsByOwnerIdAndDisplayNameAndIdNotAndDeletedFalse(ownerId, cleanName, currentDocId)) {
            return cleanName;
        }

        String baseName = cleanName;
        String ext = "";
        int lastDot = cleanName.lastIndexOf('.');
        if (lastDot > 0) {
            baseName = cleanName.substring(0, lastDot);
            ext = cleanName.substring(lastDot);
        }

        int counter = 1;
        String candidate = baseName + " (" + counter + ")" + ext;
        while (documentRepository.existsByOwnerIdAndDisplayNameAndIdNotAndDeletedFalse(ownerId, candidate, currentDocId)) {
            counter++;
            candidate = baseName + " (" + counter + ")" + ext;
        }
        return candidate;
    }

    @Override
    @Transactional
    public DocumentDto updateCategory(UUID id, UUID categoryId) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId.toString()));
                
        document.setCategory(category);
        activityService.logActivity(document, user, "CATEGORY_UPDATE", "Moved to category " + category.getName());
        return documentMapper.toDto(documentRepository.save(document));
    }

    @Override
    @Transactional
    public DocumentDto toggleFavourite(UUID id) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        document.setFavourite(!document.isFavourite());
        activityService.logActivity(document, user, "FAVOURITE_TOGGLE", "Favourite set to " + document.isFavourite());
        return documentMapper.toDto(documentRepository.save(document));
    }

    @Override
    @Transactional
    public DocumentDto archiveDocument(UUID id) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        document.setArchived(true);
        activityService.logActivity(document, user, "ARCHIVE", "Document archived");
        return documentMapper.toDto(documentRepository.save(document));
    }

    @Override
    @Transactional
    public DocumentDto restoreDocument(UUID id) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        if (document.isDeleted()) {
            document.setDeleted(false);
            document.setDeletedAt(null);
            document.setNotified7d(false);
            document.setNotified1d(false);
            activityService.logActivity(document, user, "RESTORE_TRASH", "Restored from trash");
        } else if (document.isArchived()) {
            document.setArchived(false);
            activityService.logActivity(document, user, "RESTORE_ARCHIVE", "Restored from archive");
        }
        
        return documentMapper.toDto(documentRepository.save(document));
    }

    @Override
    @Transactional
    public void softDeleteDocument(UUID id) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        // Remove from bundles, collections, and tags
        bundleDocumentRepository.deleteByDocumentId(document.getId());
        document.getCollections().clear();
        document.getTags().clear();

        document.setDeleted(true);
        document.setDeletedAt(java.time.LocalDateTime.now());
        document.setNotified7d(false);
        document.setNotified1d(false);
        activityService.logActivity(document, user, "SOFT_DELETE", "Moved to trash (30-day retention period started)");
        documentRepository.save(document);
    }

    @Override
    @Transactional
    public void permanentDeleteDocument(UUID id) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id.toString()));
        
        storageService.deleteFile(document.getBucketName(), document.getStoragePath());
        documentRepository.delete(document);
    }

    @Override
    @Transactional
    public void emptyTrash() {
        User user = getCurrentUser();
        List<Document> trashDocs = documentRepository.findByOwnerIdAndDeletedTrue(user.getId(), Pageable.unpaged()).getContent();
        for (Document document : trashDocs) {
            storageService.deleteFile(document.getBucketName(), document.getStoragePath());
            documentRepository.delete(document);
        }
    }

    @Override
    @Transactional
    public void restoreDocuments(List<UUID> documentIds) {
        User user = getCurrentUser();
        for (UUID id : documentIds) {
            documentRepository.findByIdAndOwnerId(id, user.getId()).ifPresent(document -> {
                if (document.isDeleted()) {
                    document.setDeleted(false);
                    activityService.logActivity(document, user, "RESTORE_TRASH_BATCH", "Restored from trash (batch)");
                    documentRepository.save(document);
                }
            });
        }
    }

    @Override
    @Transactional
    public void permanentDeleteDocuments(List<UUID> documentIds) {
        User user = getCurrentUser();
        for (UUID id : documentIds) {
            documentRepository.findByIdAndOwnerId(id, user.getId()).ifPresent(document -> {
                storageService.deleteFile(document.getBucketName(), document.getStoragePath());
                documentRepository.delete(document);
            });
        }
    }

    @Override
    @Transactional
    public DocumentDto addTag(UUID documentId, UUID tagId) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(documentId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId.toString()));
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", tagId.toString()));
                
        if (tag.getUser().getId().equals(user.getId())) {
            document.getTags().add(tag);
            documentRepository.save(document);
        }
        return documentMapper.toDto(document);
    }

    @Override
    @Transactional
    public DocumentDto removeTag(UUID documentId, UUID tagId) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(documentId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId.toString()));
        
        document.getTags().removeIf(t -> t.getId().equals(tagId));
        return documentMapper.toDto(documentRepository.save(document));
    }

    @Override
    @Transactional
    public DocumentDto addToCollection(UUID documentId, UUID collectionId) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(documentId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId.toString()));
        Collection collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Collection", "id", collectionId.toString()));
                
        if (collection.getUser().getId().equals(user.getId())) {
            document.getCollections().add(collection);
            documentRepository.save(document);
        }
        return documentMapper.toDto(document);
    }

    @Override
    @Transactional
    public DocumentDto removeFromCollection(UUID documentId, UUID collectionId) {
        User user = getCurrentUser();
        Document document = documentRepository.findByIdAndOwnerIdAndDeletedFalse(documentId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId.toString()));
        
        document.getCollections().removeIf(c -> c.getId().equals(collectionId));
        return documentMapper.toDto(documentRepository.save(document));
    }
}
