package com.vaultx.repository;

import com.vaultx.entity.OcrResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OcrResultRepository extends JpaRepository<OcrResult, UUID> {
    Optional<OcrResult> findFirstByDocumentIdOrderByProcessedAtDesc(UUID documentId);
    java.util.List<OcrResult> findByDocumentOwnerIdAndDocumentDeletedFalse(UUID ownerId);
}
