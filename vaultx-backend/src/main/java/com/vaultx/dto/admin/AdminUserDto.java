package com.vaultx.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {
    private UUID id;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String country;
    private boolean active;
    private boolean deleted;
    private boolean emailVerified;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    
    // Additional Stats
    private long totalDocuments;
    private long totalStorageUsed;
    private long activeSecureLinks;
}
