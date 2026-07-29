package com.vaultx.service;

import com.vaultx.dto.document.CategoryDto;
import java.util.List;
import java.util.UUID;

public interface CategoryService {
    List<CategoryDto> getAllCategories();
    CategoryDto getCategoryById(UUID id);
}
