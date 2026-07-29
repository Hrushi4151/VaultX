package com.vaultx.service.impl;

import com.vaultx.common.SecurityUtils;
import com.vaultx.dto.document.CategoryStatDto;
import com.vaultx.dto.document.DashboardStatsDto;
import com.vaultx.entity.Document;
import com.vaultx.entity.User;
import com.vaultx.exception.ResourceNotFoundException;
import com.vaultx.mapper.DocumentMapper;
import com.vaultx.repository.DocumentActivityRepository;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.repository.UserRepository;
import com.vaultx.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DocumentRepository documentRepository;
    private final DocumentActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final DocumentMapper documentMapper;

    private User getCurrentUser() {
        return userRepository.findByEmail(securityUtils.getCurrentUserEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", securityUtils.getCurrentUserEmail()));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        User user = getCurrentUser();
        
        List<Document> allDocs = documentRepository.findAll().stream()
                .filter(d -> d.getOwner().getId().equals(user.getId()))
                .collect(Collectors.toList());

        long activeCount = allDocs.stream().filter(d -> !d.isDeleted() && !d.isArchived()).count();
        long archivedCount = allDocs.stream().filter(d -> !d.isDeleted() && d.isArchived()).count();
        long trashCount = allDocs.stream().filter(Document::isDeleted).count();
        long favCount = allDocs.stream().filter(d -> !d.isDeleted() && d.isFavourite()).count();
        
        long totalStorage = allDocs.stream()
                .filter(d -> !d.isDeleted())
                .mapToLong(Document::getFileSize)
                .sum();
                
        Map<String, Long> categoryMap = allDocs.stream()
                .filter(d -> !d.isDeleted() && d.getCategory() != null)
                .collect(Collectors.groupingBy(d -> d.getCategory().getName(), Collectors.counting()));
                
        List<CategoryStatDto> categoryStats = categoryMap.entrySet().stream()
                .map(e -> new CategoryStatDto(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
                
        var recentActivities = activityRepository.findTop10ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(documentMapper::toActivityDto)
                .collect(Collectors.toList());
                
        return DashboardStatsDto.builder()
                .totalDocuments(activeCount)
                .totalStorageUsed(totalStorage)
                .favouriteDocuments(favCount)
                .archivedDocuments(archivedCount)
                .trashDocuments(trashCount)
                .categoryBreakdown(categoryStats)
                .recentActivities(recentActivities)
                .build();
    }
}
