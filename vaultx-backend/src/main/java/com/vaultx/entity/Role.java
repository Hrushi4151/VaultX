package com.vaultx.entity;

import com.vaultx.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Role entity representing a system authority.
 */
@Entity
@Table(name = "roles", indexes = {
        @Index(name = "idx_roles_name", columnList = "name", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "name", unique = true, nullable = false, length = 50)
    private RoleName name;

    @Column(name = "description", length = 255)
    private String description;
}
