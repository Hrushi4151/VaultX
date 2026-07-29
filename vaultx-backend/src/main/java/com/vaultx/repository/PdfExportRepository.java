package com.vaultx.repository;

import com.vaultx.entity.PdfExport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PdfExportRepository extends JpaRepository<PdfExport, UUID> {
    Page<PdfExport> findByOwnerId(UUID ownerId, Pageable pageable);
}
