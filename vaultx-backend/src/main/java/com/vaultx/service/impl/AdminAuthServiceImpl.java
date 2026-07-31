package com.vaultx.service.impl;

import com.vaultx.dto.auth.JwtAuthenticationResponse;
import com.vaultx.dto.auth.LoginRequest;
import com.vaultx.dto.UserDto;
import com.vaultx.dto.RoleDto;
import com.vaultx.entity.Admin;
import com.vaultx.entity.RoleName;
import com.vaultx.exception.BusinessException;
import com.vaultx.repository.AdminRepository;
import com.vaultx.security.JwtTokenProvider;
import com.vaultx.service.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuthServiceImpl implements AdminAuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Override
    @Transactional
    public JwtAuthenticationResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        Admin admin = adminRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid admin email or password"));

        if (!admin.isActive()) {
            throw new BusinessException("Admin account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new BadCredentialsException("Invalid admin email or password");
        }

        String accessToken = tokenProvider.generateToken(admin);
        String refreshTokenStr = UUID.randomUUID().toString();
        
        // Return a mock UserDto to satisfy frontend expectations, but containing ROLE_ADMIN
        UserDto adminDto = new UserDto();
        adminDto.setId(admin.getId());
        adminDto.setEmail(admin.getEmail());
        adminDto.setFirstName(admin.getFirstName());
        adminDto.setLastName(admin.getLastName());
        
        RoleDto adminRole = new RoleDto();
        adminRole.setName(RoleName.ROLE_ADMIN);
        adminDto.setRoles(Set.of(adminRole));

        return JwtAuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(adminDto)
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshToken, HttpServletRequest httpRequest) {
        // Simple logout for admin since we are not storing admin sessions in Session table
        log.info("Admin logout successful");
    }
}
