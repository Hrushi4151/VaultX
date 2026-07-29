package com.vaultx.entity;

import com.vaultx.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity tracking active user sessions across devices.
 */
@Entity
@Table(name = "sessions", indexes = {
        @Index(name = "idx_sessions_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session extends BaseEntity {

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "browser")
    private String browser;

    @Column(name = "operating_system")
    private String operatingSystem;

    @Column(name = "login_time", nullable = false)
    private Instant loginTime;

    @Column(name = "last_active_time", nullable = false)
    private Instant lastActiveTime;

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    private String refreshToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
