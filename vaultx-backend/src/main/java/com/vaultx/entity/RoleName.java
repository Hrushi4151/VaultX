package com.vaultx.entity;

/**
 * Enumeration of application roles.
 * Prefixed with ROLE_ per Spring Security convention.
 */
public enum RoleName {
    ROLE_USER,
    ROLE_ADMIN,
    ROLE_SUPER_ADMIN,
    ROLE_MODERATOR,
    ROLE_SUPPORT
}
