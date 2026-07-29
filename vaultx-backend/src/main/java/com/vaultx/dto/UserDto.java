package com.vaultx.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * User data transfer object for API responses.
 * Never exposes passwordHash or other sensitive fields.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private UUID id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String profilePicture;
    private String country;
    private boolean active;
    private boolean emailVerified;
    private boolean hasVaultPin;
    private Set<RoleDto> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
