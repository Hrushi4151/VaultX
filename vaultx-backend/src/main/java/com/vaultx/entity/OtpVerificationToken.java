package com.vaultx.entity;

import com.vaultx.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "otp_verification_tokens", indexes = {
        @Index(name = "idx_otp_token", columnList = "token", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerificationToken extends BaseEntity {

    @Column(name = "token", nullable = false, unique = true)
    private String token; // The 6-digit OTP

    @OneToOne(targetEntity = User.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    @Column(name = "expiry_date", nullable = false)
    private Instant expiryDate;
}
