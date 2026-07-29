package com.vaultx.common;

import com.vaultx.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Utility component for interacting with the Spring Security context.
 * Provides both instance and static methods for retrieving the current authenticated user.
 */
@Component
public class SecurityUtils {

    /**
     * Instance method — retrieve current user's email from the security context.
     */
    public String getCurrentUserEmail() {
        return getCurrentUserEmailStatic();
    }

    /**
     * Static method — retrieve current user's email from the security context.
     * Usable in non-Spring-managed contexts (e.g., JPA auditing).
     */
    public static String getCurrentUserEmailStatic() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("No authenticated user found in security context");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }

        if (principal instanceof String username) {
            if (AppConstants.ANONYMOUS_USER.equals(username)) {
                throw new UnauthorizedException("Anonymous user cannot access this resource");
            }
            return username;
        }

        throw new UnauthorizedException("Unable to determine current user from security context");
    }

    /**
     * Check whether a user is currently authenticated in the security context.
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && !AppConstants.ANONYMOUS_USER.equals(authentication.getPrincipal());
    }
}
