package com.vaultx.repository;

import com.vaultx.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID>, JpaSpecificationExecutor<Document> {
    
    Optional<Document> findByIdAndOwnerId(UUID id, UUID ownerId);
    
    Optional<Document> findByIdAndOwnerIdAndDeletedFalse(UUID id, UUID ownerId);

    Page<Document> findByOwnerIdAndDeletedFalse(UUID ownerId, Pageable pageable);
    
    Page<Document> findByOwnerIdAndCategoryIdAndDeletedFalse(UUID ownerId, UUID categoryId, Pageable pageable);
    
    List<Document> findByOwnerIdAndDeletedFalse(UUID ownerId);
    
    List<Document> findByOwnerIdAndCategoryIdAndDeletedFalse(UUID ownerId, UUID categoryId);
    
    List<Document> findByOwnerId(UUID ownerId);
    
    Page<Document> findByOwnerIdAndArchivedTrueAndDeletedFalse(UUID ownerId, Pageable pageable);
    
    @Query("SELECT d FROM Document d " +
           "LEFT JOIN OcrResult o ON o.document = d " +
           "LEFT JOIN DocumentAiMetadata a ON a.document = d " +
           "WHERE d.owner.id = :ownerId AND d.deleted = false " +
           "AND (LOWER(d.displayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(o.extractedText) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.tagsJson) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.detectedCategory) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.detectedType) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Document> smartSearch(@Param("ownerId") UUID ownerId, @Param("query") String query, Pageable pageable);

    Page<Document> findByOwnerIdAndDeletedTrue(UUID ownerId, Pageable pageable);

    @Query("SELECT d FROM Document d " +
           "LEFT JOIN OcrResult o ON o.document = d " +
           "LEFT JOIN DocumentAiMetadata a ON a.document = d " +
           "WHERE (LOWER(d.displayName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(o.extractedText) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.tagsJson) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.detectedCategory) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(a.detectedType) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Document> adminSmartSearch(@Param("query") String query, Pageable pageable);

    List<Document> findByDeletedTrue();
    
    Page<Document> findByOwnerIdAndFavouriteTrueAndDeletedFalse(UUID ownerId, Pageable pageable);

    long countByOwnerIdAndDeletedFalse(UUID ownerId);

    @Query("SELECT COALESCE(SUM(d.fileSize), 0L) FROM Document d WHERE d.owner.id = :ownerId AND d.deleted = false")
    Long sumFileSizeByOwnerIdAndDeletedFalse(@Param("ownerId") UUID ownerId);
    
    @Query("SELECT COALESCE(SUM(d.fileSize), 0L) FROM Document d")
    Long sumTotalFileSize();
    
    boolean existsByOwnerIdAndDisplayNameAndIdNotAndDeletedFalse(UUID ownerId, String displayName, UUID id);

    boolean existsByStoredFilename(String storedFilename);

    long countByOwnerId(UUID ownerId);

    Page<Document> findByOriginalFilenameContainingIgnoreCase(String query, Pageable pageable);
}
