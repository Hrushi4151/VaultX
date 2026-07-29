package com.vaultx.repository;

import com.vaultx.entity.ShareDownload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ShareDownloadRepository extends JpaRepository<ShareDownload, UUID> {
}
