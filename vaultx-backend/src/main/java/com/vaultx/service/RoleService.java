package com.vaultx.service;

import com.vaultx.dto.RoleDto;
import com.vaultx.entity.RoleName;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for role management operations.
 */
public interface RoleService {

    List<RoleDto> findAll();

    RoleDto findByName(RoleName name);

    RoleDto findById(UUID id);
}
