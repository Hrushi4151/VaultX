package com.vaultx.repository;

import com.vaultx.entity.ShareView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ShareViewRepository extends JpaRepository<ShareView, UUID> {
}
