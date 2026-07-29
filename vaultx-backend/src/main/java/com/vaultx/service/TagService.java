package com.vaultx.service;

import com.vaultx.dto.document.TagDto;
import java.util.List;
import java.util.UUID;

public interface TagService {
    List<TagDto> getUserTags();
    TagDto createTag(String name, String color);
    void deleteTag(UUID id);
}
