package com.vaultx.service.impl;

import com.vaultx.dto.share.PublicShareMetadataDto;
import com.vaultx.entity.Document;
import com.vaultx.entity.Share;
import com.vaultx.entity.ShareDownload;
import com.vaultx.entity.ShareFile;
import com.vaultx.entity.ShareView;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.repository.ShareDownloadRepository;
import com.vaultx.repository.ShareRepository;
import com.vaultx.repository.ShareViewRepository;
import com.vaultx.service.PublicShareService;
import com.vaultx.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicShareServiceImpl implements PublicShareService {

    private final ShareRepository shareRepository;
    private final ShareViewRepository shareViewRepository;
    private final ShareDownloadRepository shareDownloadRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;

    private Share validateAndGetShare(String token) {
        Share share = shareRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Share", "token", token));

        if (!share.isActive()) {
            throw new IllegalArgumentException("This link has been revoked by the owner.");
        }
        
        if (share.getExpiresAt() != null && LocalDateTime.now().isAfter(share.getExpiresAt())) {
            share.setActive(false);
            shareRepository.save(share);
            throw new IllegalArgumentException("This link has expired.");
        }

        if (share.getMaxDownloads() != null && share.getDownloadsCount() >= share.getMaxDownloads()) {
            share.setActive(false);
            shareRepository.save(share);
            throw new IllegalArgumentException("This link has reached its maximum download limit.");
        }

        return share;
    }

    @Override
    @Transactional
    public PublicShareMetadataDto getPublicMetadata(String token, String ipAddress, String userAgent) {
        Share share = validateAndGetShare(token);
        
        // Log the view asynchronously in a real app, doing it synchronously here
        ShareView view = ShareView.builder()
                .share(share)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        shareViewRepository.save(view);
        
        share.setViewsCount(share.getViewsCount() + 1);
        shareRepository.save(share);

        return PublicShareMetadataDto.builder()
                .name(share.getName())
                .ownerName(share.getOwner().getFirstName() + " " + share.getOwner().getLastName())
                .sharedOn(share.getCreatedAt())
                .expiresAt(share.getExpiresAt())
                .isPasswordProtected(share.getHashedPassword() != null)
                .isActive(share.isActive())
                .fileCount(share.getShareFiles().size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean verifyPassword(String token, String password) {
        Share share = validateAndGetShare(token);
        if (share.getHashedPassword() == null) return true;
        return passwordEncoder.matches(password, share.getHashedPassword());
    }

    @Override
    @Transactional
    public InputStream downloadShare(String token, String password, String ipAddress, String userAgent) throws Exception {
        Share share = validateAndGetShare(token);
        
        if (!share.isAllowDownload()) {
            throw new IllegalArgumentException("Downloads are disabled for this link.");
        }

        if (share.getHashedPassword() != null && !passwordEncoder.matches(password, share.getHashedPassword())) {
            throw new IllegalArgumentException("Invalid password.");
        }

        // Log download
        ShareDownload download = ShareDownload.builder()
                .share(share)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        shareDownloadRepository.save(download);

        share.setDownloadsCount(share.getDownloadsCount() + 1);
        shareRepository.save(share);

        List<ShareFile> files = share.getShareFiles();
        
        if (files.size() == 1) {
            // Single file stream
            Document doc = files.get(0).getDocument();
            return storageService.downloadFile(doc.getBucketName(), doc.getStoragePath());
        } else {
            // Bulk ZIP generation dynamically
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos)) {
                for (ShareFile sf : files) {
                    Document doc = sf.getDocument();
                    InputStream is = storageService.downloadFile(doc.getBucketName(), doc.getStoragePath());
                    ZipEntry entry = new ZipEntry(doc.getDisplayName());
                    zos.putNextEntry(entry);
                    byte[] buffer = new byte[8192];
                    int len;
                    while ((len = is.read(buffer)) > 0) {
                        zos.write(buffer, 0, len);
                    }
                    zos.closeEntry();
                    is.close();
                }
            }
            return new ByteArrayInputStream(baos.toByteArray());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.vaultx.dto.share.PublicDocumentDto> getShareDocuments(String token, String password, String ipAddress, String userAgent) {
        Share share = validateAndGetShare(token);
        
        if (share.getHashedPassword() != null && !passwordEncoder.matches(password, share.getHashedPassword())) {
            throw new IllegalArgumentException("Invalid password.");
        }

        return share.getShareFiles().stream()
                .map(sf -> {
                    Document doc = sf.getDocument();
                    return com.vaultx.dto.share.PublicDocumentDto.builder()
                            .id(doc.getId())
                            .displayName(doc.getDisplayName())
                            .originalFilename(doc.getOriginalFilename())
                            .mimeType(doc.getMimeType())
                            .fileSize(doc.getFileSize())
                            .extension(doc.getExtension())
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional
    public InputStream downloadSingleDocument(String token, String docId, String password, String ipAddress, String userAgent) throws Exception {
        Share share = validateAndGetShare(token);
        
        if (!share.isAllowDownload()) {
            throw new IllegalArgumentException("Downloads are disabled for this link.");
        }

        if (share.getHashedPassword() != null && !passwordEncoder.matches(password, share.getHashedPassword())) {
            throw new IllegalArgumentException("Invalid password.");
        }

        ShareFile targetFile = share.getShareFiles().stream()
                .filter(sf -> sf.getDocument().getId().toString().equals(docId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", docId));

        // Log download
        ShareDownload download = ShareDownload.builder()
                .share(share)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        shareDownloadRepository.save(download);

        share.setDownloadsCount(share.getDownloadsCount() + 1);
        shareRepository.save(share);

        Document doc = targetFile.getDocument();
        return storageService.downloadFile(doc.getBucketName(), doc.getStoragePath());
    }
}
