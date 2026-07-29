package com.vaultx.repository;

import com.vaultx.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, UUID> {
    List<Collection> findByUserId(UUID userId);
    Optional<Collection> findByNameAndUserId(String name, UUID userId);
}
