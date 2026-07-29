package com.vaultx.repository;

import com.vaultx.entity.PdfTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PdfTemplateRepository extends JpaRepository<PdfTemplate, UUID> {
    List<PdfTemplate> findByOwnerId(UUID ownerId);
}
