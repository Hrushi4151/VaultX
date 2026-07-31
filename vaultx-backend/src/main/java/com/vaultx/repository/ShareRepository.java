package com.vaultx.repository;

import com.vaultx.entity.Share;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShareRepository extends JpaRepository<Share, UUID> {
    Page<Share> findByOwnerId(UUID ownerId, Pageable pageable);
    long countByOwnerId(UUID ownerId);
    Optional<Share> findByToken(String token);
}
