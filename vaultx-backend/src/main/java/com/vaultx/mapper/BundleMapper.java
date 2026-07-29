package com.vaultx.mapper;

import com.vaultx.dto.bundle.BundleCreateRequest;
import com.vaultx.dto.bundle.BundleDocumentDto;
import com.vaultx.dto.bundle.BundleDto;
import com.vaultx.dto.bundle.BundleSettingsDto;
import com.vaultx.entity.Bundle;
import com.vaultx.entity.BundleDocument;
import com.vaultx.entity.BundleSettings;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.AfterMapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {DocumentMapper.class})
public interface BundleMapper {

    @Mapping(target = "totalFileSize", expression = "java(calculateTotalSize(bundle))")
    BundleDto toDto(Bundle bundle);

    BundleSettingsDto toSettingsDto(BundleSettings settings);
    
    @Mapping(target = "document", source = "document")
    BundleDocumentDto toDocumentDto(BundleDocument bundleDocument);

    Bundle toEntity(BundleCreateRequest request);
    BundleSettings toSettingsEntity(BundleSettingsDto dto);

    default long calculateTotalSize(Bundle bundle) {
        if (bundle.getDocuments() == null) return 0;
        return bundle.getDocuments().stream()
                .filter(bd -> !bd.getDocument().isDeleted())
                .mapToLong(bd -> bd.getDocument().getFileSize())
                .sum();
    }

    @AfterMapping
    default void filterDeletedDocuments(Bundle bundle, @MappingTarget BundleDto dto) {
        if (dto.getDocuments() != null) {
            dto.getDocuments().removeIf(bd -> bd.getDocument() != null && bd.getDocument().isDeleted());
        }
    }
}
