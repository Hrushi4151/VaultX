package com.vaultx.controller;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.share.ShareCreateRequest;
import com.vaultx.dto.share.ShareDto;
import com.vaultx.service.ShareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/shares")
@RequiredArgsConstructor
@Tag(name = "Share Management", description = "Authenticated endpoints for managing secure share links")
public class ShareController {

    private final ShareService shareService;

    @PostMapping
    @Operation(summary = "Create a new secure share link")
    public ResponseEntity<ShareDto> createShare(@Valid @RequestBody ShareCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shareService.createShare(request));
    }

    @GetMapping
    @Operation(summary = "Get all shares for the current user")
    public ResponseEntity<PagedResponse<ShareDto>> getUserShares(Pageable pageable) {
        return ResponseEntity.ok(shareService.getUserShares(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get share details by ID")
    public ResponseEntity<ShareDto> getShare(@PathVariable UUID id) {
        return ResponseEntity.ok(shareService.getShare(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a share entirely")
    public ResponseEntity<Void> deleteShare(@PathVariable UUID id) {
        shareService.deleteShare(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/revoke")
    @Operation(summary = "Instantly revoke access to a share link")
    public ResponseEntity<Void> revokeShare(@PathVariable UUID id) {
        shareService.revokeShare(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/password")
    @Operation(summary = "Update or remove password for a share link")
    public ResponseEntity<Void> updatePassword(@PathVariable UUID id, @RequestParam(required = false) String password) {
        shareService.updatePassword(id, password);
        return ResponseEntity.ok().build();
    }
}
