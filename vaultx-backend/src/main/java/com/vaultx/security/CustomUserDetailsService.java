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

        Optional<Admin> adminOpt = adminRepository.findByEmail(username);
        Optional<User> userOpt = userRepository.findByEmailWithRoles(username)
                .or(() -> userRepository.findByUsername(username));

        if (adminOpt.isEmpty() && userOpt.isEmpty()) {
            log.warn("User not found for identifier: {}", username);
            throw new UsernameNotFoundException("User not found: " + username);
        }

        List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>();
        String password = "";
        boolean active = false;
        String finalUsername = username;

        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            password = admin.getPasswordHash();
            active = admin.isActive();
            finalUsername = admin.getEmail();
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            password = user.getPasswordHash(); // Prefer User password for Spring Security internals
            active = active || user.isActive();
            finalUsername = user.getEmail();
            user.getRoles().forEach(role -> authorities.add(new SimpleGrantedAuthority(role.getName().name())));
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(finalUsername)
                .password(password)
                .disabled(!active)
                .accountLocked(!active)
                .authorities(authorities)
                .build();
    }
}
