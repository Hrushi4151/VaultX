package com.vaultx.controller.admin;

import com.vaultx.dto.admin.AdminDocumentDto;
import com.vaultx.service.AdminManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/documents")
@RequiredArgsConstructor
@Tag(name = "Admin Documents", description = "Admin document registry")
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
public class AdminDocumentController {

    private final AdminManagementService adminManagementService;

    @GetMapping
    @Operation(summary = "Search all documents (metadata only)")
    public ResponseEntity<Page<AdminDocumentDto>> searchDocuments(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(adminManagementService.searchDocuments(search, pageable));
    }
}
