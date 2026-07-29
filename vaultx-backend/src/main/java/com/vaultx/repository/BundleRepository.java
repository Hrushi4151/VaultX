package com.vaultx.repository;

import com.vaultx.entity.Bundle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BundleRepository extends JpaRepository<Bundle, UUID> {
    Page<Bundle> findByOwnerIdAndArchivedFalse(UUID ownerId, Pageable pageable);
}
