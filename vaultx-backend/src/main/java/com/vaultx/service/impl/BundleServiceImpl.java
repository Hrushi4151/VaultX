package com.vaultx.service.impl;

import com.vaultx.common.PagedResponse;
import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.bundle.BundleCreateRequest;
import com.vaultx.dto.bundle.BundleUpdateRequest;
import com.vaultx.dto.bundle.BundleDto;
import com.vaultx.dto.bundle.DocumentReorderRequest;
import com.vaultx.entity.*;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.exception.BusinessException;
import com.vaultx.mapper.BundleMapper;
import com.vaultx.repository.*;
import com.vaultx.service.BundleService;
import com.vaultx.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BundleServiceImpl implements BundleService {

    private final BundleRepository bundleRepository;
    private final BundleActivityRepository activityRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final BundleMapper bundleMapper;
    private final StorageService storageService;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    private Bundle getBundleAndVerifyOwner(UUID id, User user) {
        Bundle bundle = bundleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bundle", "id", id.toString()));
        if (!bundle.getOwner().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Bundle", "id", id.toString());
        }
        return bundle;
    }

    private void logActivity(Bundle bundle, User user, String action, String details) {
        BundleActivity activity = BundleActivity.builder()
                .bundle(bundle)
                .user(user)
                .action(action)
                .details(details)
                .build();
        activityRepository.save(activity);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadBundle(UUID id) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);

        List<Document> docs = bundle.getDocuments().stream()
                .map(BundleDocument::getDocument)
                .filter(d -> !d.isDeleted())
                .collect(Collectors.toList());

        if (docs.isEmpty()) {
            throw new BusinessException("Bundle is empty or contains only deleted documents");
        }

        try {
            java.util.Map<String, Integer> nameCount = new java.util.HashMap<>();
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos)) {
                String folderName = bundle.getName().replaceAll("[\\\\/:*?\"<>|]", "_") + "/";
                
                for (Document doc : docs) {
                    String baseName = doc.getDisplayName();
                    int count = nameCount.getOrDefault(baseName, 0);
                    nameCount.put(baseName, count + 1);
                    
                    String entryName = baseName;
                    if (count > 0) {
                        int dotIndex = baseName.lastIndexOf('.');
                        if (dotIndex > 0) {
                            entryName = baseName.substring(0, dotIndex) + " (" + count + ")" + baseName.substring(dotIndex);
                        } else {
                            entryName = baseName + " (" + count + ")";
                        }
                    }

                    java.util.zip.ZipEntry entry = new java.util.zip.ZipEntry(folderName + entryName);
                    zos.putNextEntry(entry);
                    
                    try (java.io.InputStream is = storageService.downloadFile(doc.getBucketName(), doc.getStoragePath())) {
                        is.transferTo(zos);
                    }
                    zos.closeEntry();
                }
            }
            return baos.toByteArray();
        } catch (java.io.IOException e) {
            throw new BusinessException("Failed to create ZIP for bundle");
        }
    }

    @Override
    @Transactional
    public BundleDto createBundle(BundleCreateRequest request) {
        User user = getCurrentUser();
        
        Bundle bundle = bundleMapper.toEntity(request);
        bundle.setOwner(user);

        if (request.getSettings() != null) {
            BundleSettings settings = bundleMapper.toSettingsEntity(request.getSettings());
            bundle.setSettings(settings);
        } else {
            bundle.setSettings(BundleSettings.builder().bundle(bundle).build());
        }

        if (request.getDocumentIds() != null && !request.getDocumentIds().isEmpty()) {
            int order = 0;
            for (UUID docId : request.getDocumentIds()) {
                Optional<Document> docOpt = documentRepository.findById(docId);
                if (docOpt.isPresent() && docOpt.get().getOwner().getId().equals(user.getId())) {
                    BundleDocument bd = BundleDocument.builder()
                            .document(docOpt.get())
                            .orderIndex(order++)
                            .build();
                    bundle.addDocument(bd);
                }
            }
        }

        Bundle saved = bundleRepository.save(bundle);
        logActivity(saved, user, "CREATE", "Created bundle " + saved.getName());
        
        return bundleMapper.toDto(saved);
    }

    @Override
    @Transactional
    public BundleDto updateBundle(UUID id, BundleUpdateRequest request) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);

        bundle.setName(request.getName());
        bundle.setDescription(request.getDescription());

        if (request.getSettings() != null) {
            BundleSettings settings = bundle.getSettings();
            if (settings == null) {
                settings = BundleSettings.builder().bundle(bundle).build();
                bundle.setSettings(settings);
            }
            settings.setIncludeCoverPage(request.getSettings().isIncludeCoverPage());
            settings.setIncludeToc(request.getSettings().isIncludeToc());
            settings.setIncludePageNumbers(request.getSettings().isIncludePageNumbers());
            settings.setWatermarkText(request.getSettings().getWatermarkText());
            settings.setCompressOutput(request.getSettings().isCompressOutput());
            settings.setOutputName(request.getSettings().getOutputName());
        }

        Bundle saved = bundleRepository.save(bundle);
        logActivity(saved, user, "UPDATE", "Updated bundle details");
        return bundleMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<BundleDto> getUserBundles(Pageable pageable) {
        User user = getCurrentUser();
        Page<Bundle> bundles = bundleRepository.findByOwnerIdAndArchivedFalse(user.getId(), pageable);
        List<BundleDto> content = bundles.getContent().stream()
                .map(bundleMapper::toDto)
                .collect(Collectors.toList());

        return PagedResponse.<BundleDto>builder()
                .content(content)
                .page(bundles.getNumber())
                .size(bundles.getSize())
                .totalElements(bundles.getTotalElements())
                .totalPages(bundles.getTotalPages())
                .last(bundles.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BundleDto getBundleById(UUID id) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);
        return bundleMapper.toDto(bundle);
    }

    @Override
    @Transactional
    public BundleDto duplicateBundle(UUID id) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);

        Bundle copy = Bundle.builder()
                .name(bundle.getName() + " (Copy)")
                .description(bundle.getDescription())
                .color(bundle.getColor())
                .icon(bundle.getIcon())
                .owner(user)
                .build();

        BundleSettings originalSettings = bundle.getSettings();
        if (originalSettings != null) {
            BundleSettings copySettings = BundleSettings.builder()
                    .bundle(copy)
                    .includeCoverPage(originalSettings.isIncludeCoverPage())
                    .includeToc(originalSettings.isIncludeToc())
                    .includePageNumbers(originalSettings.isIncludePageNumbers())
                    .watermarkText(originalSettings.getWatermarkText())
                    .compressOutput(originalSettings.isCompressOutput())
                    .outputName(originalSettings.getOutputName())
                    .build();
            copy.setSettings(copySettings);
        }

        for (BundleDocument bd : bundle.getDocuments()) {
            BundleDocument bdCopy = BundleDocument.builder()
                    .document(bd.getDocument())
                    .orderIndex(bd.getOrderIndex())
                    .build();
            copy.addDocument(bdCopy);
        }

        Bundle saved = bundleRepository.save(copy);
        logActivity(saved, user, "DUPLICATE", "Duplicated from " + bundle.getName());
        
        return bundleMapper.toDto(saved);
    }

    @Override
    @Transactional
    public BundleDto toggleFavourite(UUID id) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);
        bundle.setFavourite(!bundle.isFavourite());
        return bundleMapper.toDto(bundleRepository.save(bundle));
    }

    @Override
    @Transactional
    public BundleDto archiveBundle(UUID id) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);
        bundle.setArchived(true);
        logActivity(bundle, user, "ARCHIVE", "Archived bundle");
        return bundleMapper.toDto(bundleRepository.save(bundle));
    }

    @Override
    @Transactional
    public BundleDto restoreBundle(UUID id) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);
        bundle.setArchived(false);
        logActivity(bundle, user, "RESTORE", "Restored bundle");
        return bundleMapper.toDto(bundleRepository.save(bundle));
    }

    @Override
    @Transactional
    public void deleteBundle(UUID id) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(id, user);
        bundleRepository.delete(bundle);
    }

    @Override
    @Transactional
    public BundleDto addDocuments(UUID bundleId, List<UUID> documentIds) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(bundleId, user);
        
        int maxOrder = bundle.getDocuments().stream().mapToInt(BundleDocument::getOrderIndex).max().orElse(-1);
        
        for (UUID docId : documentIds) {
            Optional<Document> docOpt = documentRepository.findById(docId);
            if (docOpt.isPresent() && docOpt.get().getOwner().getId().equals(user.getId())) {
                boolean alreadyExists = bundle.getDocuments().stream()
                        .anyMatch(bd -> bd.getDocument().getId().equals(docId));
                if (!alreadyExists) {
                    BundleDocument bd = BundleDocument.builder()
                            .document(docOpt.get())
                            .orderIndex(++maxOrder)
                            .build();
                    bundle.addDocument(bd);
                }
            }
        }
        
        Bundle saved = bundleRepository.save(bundle);
        logActivity(saved, user, "ADD_DOCUMENTS", "Added " + documentIds.size() + " documents");
        return bundleMapper.toDto(saved);
    }

    @Override
    @Transactional
    public BundleDto removeDocument(UUID bundleId, UUID documentId) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(bundleId, user);
        
        bundle.getDocuments().removeIf(bd -> bd.getDocument().getId().equals(documentId));
        
        // Reindex remaining
        List<BundleDocument> sorted = bundle.getDocuments().stream()
                .sorted((a, b) -> a.getOrderIndex().compareTo(b.getOrderIndex()))
                .collect(Collectors.toList());
        for (int i = 0; i < sorted.size(); i++) {
            sorted.get(i).setOrderIndex(i);
        }
        
        Bundle saved = bundleRepository.save(bundle);
        logActivity(saved, user, "REMOVE_DOCUMENT", "Removed document");
        return bundleMapper.toDto(saved);
    }

    @Override
    @Transactional
    public BundleDto reorderDocuments(UUID bundleId, DocumentReorderRequest request) {
        User user = getCurrentUser();
        Bundle bundle = getBundleAndVerifyOwner(bundleId, user);
        
        List<UUID> newOrder = request.getDocumentIds();
        for (int i = 0; i < newOrder.size(); i++) {
            UUID docId = newOrder.get(i);
            int index = i;
            bundle.getDocuments().stream()
                    .filter(bd -> bd.getDocument().getId().equals(docId))
                    .findFirst()
                    .ifPresent(bd -> bd.setOrderIndex(index));
        }
        
        Bundle saved = bundleRepository.save(bundle);
        logActivity(saved, user, "REORDER", "Reordered documents");
        return bundleMapper.toDto(saved);
    }
}
