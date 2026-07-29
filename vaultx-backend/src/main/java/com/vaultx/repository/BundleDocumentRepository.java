package com.vaultx.repository;

import com.vaultx.entity.BundleDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BundleDocumentRepository extends JpaRepository<BundleDocument, UUID> {
    void deleteByDocumentId(UUID documentId);
}
