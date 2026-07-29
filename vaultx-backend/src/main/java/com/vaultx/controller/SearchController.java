package com.vaultx.controller;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.document.DocumentDto;
import com.vaultx.service.SmartSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@Tag(name = "Smart Search", description = "Endpoints for intelligent full-text global search")
public class SearchController {

    private final SmartSearchService smartSearchService;

    @GetMapping
    @Operation(summary = "Perform a global intelligent search across all documents")
    public ResponseEntity<PagedResponse<DocumentDto>> search(
            @RequestParam(required = false) String query,
            Pageable pageable) {
        return ResponseEntity.ok(smartSearchService.searchDocuments(query, pageable));
    }
}
