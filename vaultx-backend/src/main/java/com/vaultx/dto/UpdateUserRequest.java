package com.vaultx.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request DTO for updating an existing user's profile information.
 * Only mutable profile fields are included.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    @Size(max = 50, message = "First name cannot exceed 50 characters")
    private String firstName;

    @Size(max = 50, message = "Last name cannot exceed 50 characters")
    private String lastName;

    @Size(max = 500, message = "Profile picture URL cannot exceed 500 characters")
    private String profilePicture;
}
