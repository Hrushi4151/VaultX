package com.vaultx.repository;

import com.vaultx.entity.DocumentAiMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentAiMetadataRepository extends JpaRepository<DocumentAiMetadata, UUID> {
    Optional<DocumentAiMetadata> findByDocumentId(UUID documentId);
    java.util.List<DocumentAiMetadata> findByDocumentOwnerIdAndDocumentDeletedFalse(UUID ownerId);
}
