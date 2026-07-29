package com.vaultx.service.impl;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.UserDto;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.UserMapper;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserDto> getAllUsers(String search, Pageable pageable) {
        Page<User> users;
        if (search != null && !search.trim().isEmpty()) {
            users = userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(search, search, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        List<UserDto> content = users.getContent().stream()
                .map(u -> UserDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .profilePicture(u.getProfilePicture())
                        .build()) // Note: in real app, we'd map active status too, adding it manually if missing in DTO
                .collect(Collectors.toList());

        return PagedResponse.<UserDto>builder()
                .content(content)
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .last(users.isLast())
                .build();
    }

    @Override
    @Transactional
    public void suspendUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void activateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId.toString()));
        user.setActive(true);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(UUID userId) {
        // Soft or hard delete depending on policy.
        userRepository.deleteById(userId);
    }
}
