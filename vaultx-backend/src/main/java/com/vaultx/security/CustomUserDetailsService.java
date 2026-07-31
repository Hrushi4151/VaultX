package com.vaultx.security;

import com.vaultx.entity.Admin;
import com.vaultx.entity.User;
import com.vaultx.repository.AdminRepository;
import com.vaultx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Spring Security UserDetailsService implementation.
 * Loads user by email (primary) or username (fallback), with eager role loading.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading UserDetails for: {}", username);

        // Check if Admin exists
        Optional<Admin> adminOpt = adminRepository.findByEmail(username);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return org.springframework.security.core.userdetails.User.builder()
                    .username(admin.getEmail())
                    .password(admin.getPasswordHash())
                    .disabled(!admin.isActive())
                    .accountLocked(!admin.isActive())
                    .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
                    .build();
        }

        // Check if regular User exists
        User user = userRepository.findByEmailWithRoles(username)
                .or(() -> userRepository.findByUsername(username))
                .orElseThrow(() -> {
                    log.warn("User not found for identifier: {}", username);
                    return new UsernameNotFoundException("User not found: " + username);
                });

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .disabled(!user.isActive())
                .accountLocked(!user.isActive())
                .authorities(user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                        .collect(Collectors.toList()))
                .build();
    }
}
