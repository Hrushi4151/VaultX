package com.vaultx.config;

import com.vaultx.common.AppConstants;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * JPA auditing configuration.
 * Automatically populates createdBy / updatedBy audit fields via AuditorAware.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            try {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null
                        || !authentication.isAuthenticated()
                        || AppConstants.ANONYMOUS_USER.equals(authentication.getPrincipal())) {
                    return Optional.of(AppConstants.SYSTEM_USER);
                }
                return Optional.of(authentication.getName());
            } catch (Exception e) {
                return Optional.of(AppConstants.SYSTEM_USER);
            }
        };
    }
}
