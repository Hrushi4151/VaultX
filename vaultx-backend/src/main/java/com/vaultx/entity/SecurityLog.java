package com.vaultx.entity;

import com.vaultx.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Entity for tracking security events (logins, password changes, etc.).
 */
@Entity
@Table(name = "security_logs", indexes = {
        @Index(name = "idx_security_logs_user", columnList = "user_id"),
        @Index(name = "idx_security_logs_action", columnList = "action")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityLog extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 50)
    private SecurityAction action;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
