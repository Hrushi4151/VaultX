package com.vaultx.repository;

import com.vaultx.entity.DocumentActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentActivityRepository extends JpaRepository<DocumentActivity, UUID> {
    List<DocumentActivity> findByDocumentIdOrderByCreatedAtDesc(UUID documentId);
    List<DocumentActivity> findTop10ByUserIdOrderByCreatedAtDesc(UUID userId);
}
