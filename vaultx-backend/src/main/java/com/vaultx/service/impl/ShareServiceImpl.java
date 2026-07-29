package com.vaultx.service.impl;

import com.vaultx.common.PagedResponse;
import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.share.ShareCreateRequest;
import com.vaultx.dto.share.ShareDto;
import com.vaultx.entity.Document;
import com.vaultx.entity.Share;
import com.vaultx.entity.ShareFile;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.ShareMapper;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.ShareRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.ShareService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShareServiceImpl implements ShareService {

    private final ShareRepository shareRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final ShareMapper shareMapper;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;

    private static final String ALLOWED_CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int TOKEN_LENGTH = 12;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(TOKEN_LENGTH);
        for (int i = 0; i < TOKEN_LENGTH; i++) {
            sb.append(ALLOWED_CHARACTERS.charAt(random.nextInt(ALLOWED_CHARACTERS.length())));
        }
        return sb.toString();
    }

    @Override
    @Transactional
    public ShareDto createShare(ShareCreateRequest request) {
        User user = getCurrentUser();

        Share share = Share.builder()
                .token(generateSecureToken())
                .owner(user)
                .name(request.getName())
                .targetType(request.getTargetType())
                .expiresAt(request.getExpiresAt() != null ? request.getExpiresAt().toLocalDateTime() : null)
                .maxDownloads(request.getMaxDownloads())
                .allowDownload(request.isAllowDownload())
                .allowPrint(request.isAllowPrint())
                .allowCopy(request.isAllowCopy())
                .allowPdfExport(request.isAllowPdfExport())
                .isActive(true)
                .downloadsCount(0)
                .viewsCount(0)
                .build();

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            share.setHashedPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Only mapping documents for now (Collections/Bundles could be expanded)
        if (request.getDocumentIds() != null) {
            for (UUID docId : request.getDocumentIds()) {
                Optional<Document> docOpt = documentRepository.findById(docId);
                if (docOpt.isPresent() && docOpt.get().getOwner().getId().equals(user.getId())) {
                    share.addShareFile(ShareFile.builder().document(docOpt.get()).build());
                }
            }
        }

        Share saved = shareRepository.save(share);
        return shareMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ShareDto> getUserShares(Pageable pageable) {
        User user = getCurrentUser();
        Page<Share> page = shareRepository.findByOwnerId(user.getId(), pageable);
        List<ShareDto> content = page.getContent().stream()
                .map(shareMapper::toDto)
                .collect(Collectors.toList());

        return PagedResponse.<ShareDto>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ShareDto getShare(UUID id) {
        Share share = shareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Share", "id", id.toString()));
        if (!share.getOwner().getId().equals(getCurrentUser().getId())) {
            throw new ResourceNotFoundException("Share", "id", id.toString());
        }
        return shareMapper.toDto(share);
    }

    @Override
    @Transactional
    public void revokeShare(UUID id) {
        Share share = shareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Share", "id", id.toString()));
        if (!share.getOwner().getId().equals(getCurrentUser().getId())) {
            throw new ResourceNotFoundException("Share", "id", id.toString());
        }
        share.setActive(false);
        shareRepository.save(share);
    }

    @Override
    @Transactional
    public void deleteShare(UUID id) {
        Share share = shareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Share", "id", id.toString()));
        if (!share.getOwner().getId().equals(getCurrentUser().getId())) {
            throw new ResourceNotFoundException("Share", "id", id.toString());
        }
        shareRepository.delete(share);
    }

    @Override
    @Transactional
    public void updatePassword(UUID id, String newPassword) {
        Share share = shareRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Share", "id", id.toString()));
        if (!share.getOwner().getId().equals(getCurrentUser().getId())) {
            throw new ResourceNotFoundException("Share", "id", id.toString());
        }
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            share.setHashedPassword(passwordEncoder.encode(newPassword));
        } else {
            share.setHashedPassword(null);
        }
        shareRepository.save(share);
    }
}
