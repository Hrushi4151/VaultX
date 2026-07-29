package com.vaultx.dto.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionDto {
    private UUID id;
    private String name;
    private String description;
    private int documentCount;
    private LocalDateTime createdAt;
    private List<DocumentDto> documents;
}
