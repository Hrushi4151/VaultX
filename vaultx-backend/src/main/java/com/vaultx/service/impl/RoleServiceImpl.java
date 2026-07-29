package com.vaultx.service.impl;

import com.vaultx.dto.RoleDto;
import com.vaultx.entity.RoleName;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.UserMapper;
import com.vaultx.repository.RoleRepository;
import com.vaultx.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Implementation of {@link RoleService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final UserMapper userMapper;

    @Override
    public List<RoleDto> findAll() {
        log.debug("Fetching all roles");
        return roleRepository.findAll().stream()
                .map(userMapper::roleToDto)
                .toList();
    }

    @Override
    public RoleDto findByName(RoleName name) {
        log.debug("Fetching role by name: {}", name);
        return roleRepository.findByName(name)
                .map(userMapper::roleToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", name.name()));
    }

    @Override
    public RoleDto findById(UUID id) {
        log.debug("Fetching role by id: {}", id);
        return roleRepository.findById(id)
                .map(userMapper::roleToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id.toString()));
    }
}
