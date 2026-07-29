package com.vaultx.repository;

import com.vaultx.entity.DocumentExpiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentExpiryRepository extends JpaRepository<DocumentExpiry, UUID> {
    Optional<DocumentExpiry> findByDocumentId(UUID documentId);
    List<DocumentExpiry> findByExpiryDateBeforeAndIsExpiredFalse(LocalDate date);
    List<DocumentExpiry> findByDocumentOwnerIdAndDocumentDeletedFalse(UUID ownerId);
}
