package com.vaultx.service.impl;

import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.document.TagDto;
import com.vaultx.entity.Tag;
import com.vaultx.entity.User;
import com.vaultx.exception.BusinessException;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.DocumentMapper;
import com.vaultx.repository.TagRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final DocumentMapper documentMapper;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagDto> getUserTags() {
        return tagRepository.findByUserId(getCurrentUser().getId()).stream()
                .map(documentMapper::toTagDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TagDto createTag(String name, String color) {
        User user = getCurrentUser();
        if (tagRepository.findByNameAndUserId(name, user.getId()).isPresent()) {
            throw new BusinessException("Tag with this name already exists");
        }
        Tag tag = Tag.builder()
                .name(name)
                .color(color != null ? color : "#3B82F6")
                .user(user)
                .build();
        return documentMapper.toTagDto(tagRepository.save(tag));
    }

    @Override
    @Transactional
    public void deleteTag(UUID id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id.toString()));
        if (!tag.getUser().getId().equals(getCurrentUser().getId())) {
            throw new BusinessException("Not authorized to delete this tag");
        }
        tagRepository.delete(tag);
    }
}
