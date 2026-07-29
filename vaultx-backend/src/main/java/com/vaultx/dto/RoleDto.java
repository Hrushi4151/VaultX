package com.vaultx.dto;

import com.vaultx.entity.RoleName;
import lombok.*;

import java.util.UUID;

/**
 * Role data transfer object for API responses.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDto {

    private UUID id;
    private RoleName name;
    private String description;
}
