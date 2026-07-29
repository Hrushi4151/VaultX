package com.vaultx.repository;

import com.vaultx.entity.PdfSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PdfSettingsRepository extends JpaRepository<PdfSettings, UUID> {
    Optional<PdfSettings> findByOwnerId(UUID ownerId);
}
