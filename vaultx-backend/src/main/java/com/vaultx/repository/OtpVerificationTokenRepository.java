package com.vaultx.repository;

import com.vaultx.entity.OtpVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpVerificationTokenRepository extends JpaRepository<OtpVerificationToken, UUID> {
    Optional<OtpVerificationToken> findByToken(String token);
    void deleteByUserId(UUID userId);
    Optional<OtpVerificationToken> findByUserId(UUID userId);
}
