package com.vaultx.controller.admin;

import com.vaultx.dto.admin.AdminUserDto;
import com.vaultx.service.AdminManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin Users", description = "Admin user management")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
public class AdminUserController {

    private final AdminManagementService adminManagementService;

    @GetMapping
    @Operation(summary = "Search users with stats")
    public ResponseEntity<Page<AdminUserDto>> searchUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(adminManagementService.searchUsers(search, status, pageable));
    }

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspend user")
    public ResponseEntity<Void> suspendUser(@PathVariable UUID id) {
        adminManagementService.suspendUser(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate user")
    public ResponseEntity<Void> activateUser(@PathVariable UUID id) {
        adminManagementService.activateUser(id);
        return ResponseEntity.ok().build();
    }
}
