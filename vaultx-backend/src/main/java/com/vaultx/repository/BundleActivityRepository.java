package com.vaultx.repository;

import com.vaultx.entity.BundleActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BundleActivityRepository extends JpaRepository<BundleActivity, UUID> {
}
