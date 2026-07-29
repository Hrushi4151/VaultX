package com.vaultx.mapper;

import com.vaultx.dto.document.*;
import com.vaultx.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DocumentMapper {

    CategoryDto toCategoryDto(Category category);
    
    TagDto toTagDto(Tag tag);
    
    @Mapping(target = "documents", ignore = true)
    @Mapping(target = "documentCount", ignore = true)
    CollectionDto toCollectionDto(Collection collection);

    @Mapping(target = "userFullName", expression = "java(activity.getUser().getFirstName() + ' ' + activity.getUser().getLastName())")
    DocumentActivityDto toActivityDto(DocumentActivity activity);

    @Mapping(target = "collections", ignore = true)
    @Mapping(target = "daysRemaining", expression = "java(calculateDaysRemaining(document))")
    DocumentDto toDto(Document document);

    default Long calculateDaysRemaining(Document document) {
        if (!document.isDeleted()) return null;
        java.time.LocalDateTime deletedAt = document.getDeletedAt();
        if (deletedAt == null) {
            deletedAt = document.getUpdatedAt() != null ? document.getUpdatedAt() : document.getCreatedAt();
        }
        long daysInTrash = java.time.temporal.ChronoUnit.DAYS.between(deletedAt, java.time.LocalDateTime.now());
        long rem = 30 - daysInTrash;
        return Math.max(0, rem);
    }
}
