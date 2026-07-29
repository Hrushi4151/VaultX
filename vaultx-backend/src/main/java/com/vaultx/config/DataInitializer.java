package com.vaultx.config;

import com.vaultx.entity.Role;
import com.vaultx.entity.RoleName;
import com.vaultx.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seed default data on application startup.
 * Idempotent — only inserts records that don't already exist.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        log.info("Running data initializer...");
        initializeRoles();
        log.info("Data initialization complete.");
    }

    private void initializeRoles() {
        for (RoleName roleName : RoleName.values()) {
            if (!roleRepository.existsByName(roleName)) {
                Role role = Role.builder()
                        .name(roleName)
                        .description(buildDescription(roleName))
                        .build();
                roleRepository.save(role);
                log.info("Seeded role: {}", roleName);
            } else {
                log.debug("Role already exists, skipping: {}", roleName);
            }
        }
    }

    private String buildDescription(RoleName roleName) {
        return switch (roleName) {
            case ROLE_USER  -> "Standard user with access to personal documents and platform features";
            case ROLE_ADMIN -> "Administrator with full system access and management capabilities";
            default -> "System role: " + roleName.name();
        };
    }
}
