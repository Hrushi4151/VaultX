package com.vaultx.mapper;

import com.vaultx.dto.RoleDto;
import com.vaultx.dto.UpdateUserRequest;
import com.vaultx.dto.UserDto;
import com.vaultx.entity.Role;
import com.vaultx.entity.User;
import org.mapstruct.*;

/**
 * MapStruct mapper for converting between User/Role entities and their DTOs.
 * Spring component model is configured via pom.xml compiler args.
 */
@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    @Mapping(target = "hasVaultPin", expression = "java(user.getVaultPinHash() != null && !user.getVaultPinHash().isEmpty())")
    UserDto toDto(User user);

    RoleDto roleToDto(Role role);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "active", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntityFromDto(UpdateUserRequest request, @MappingTarget User user);
}
