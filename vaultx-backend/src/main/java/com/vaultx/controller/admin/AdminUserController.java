package com.vaultx.controller.admin;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.UserDto;
import com.vaultx.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin Users", description = "Enterprise user management")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "List all users with search and pagination")
    public ResponseEntity<PagedResponse<UserDto>> getUsers(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(adminUserService.getAllUsers(search, pageable));
    }

    @PostMapping("/{id}/suspend")
    @Operation(summary = "Suspend a user account")
    public ResponseEntity<Void> suspendUser(@PathVariable UUID id) {
        adminUserService.suspendUser(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate a user account")
    public ResponseEntity<Void> activateUser(@PathVariable UUID id) {
        adminUserService.activateUser(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user account")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
