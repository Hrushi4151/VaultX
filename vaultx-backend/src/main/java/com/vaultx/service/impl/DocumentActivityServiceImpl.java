package com.vaultx.service.impl;

import com.vaultx.entity.Document;
import com.vaultx.entity.DocumentActivity;
import com.vaultx.entity.User;
import com.vaultx.repository.DocumentActivityRepository;
import com.vaultx.service.DocumentActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DocumentActivityServiceImpl implements DocumentActivityService {

    private final DocumentActivityRepository documentActivityRepository;

    @Override
    @Transactional
    public void logActivity(Document document, User user, String action, String details) {
        DocumentActivity activity = DocumentActivity.builder()
                .document(document)
                .user(user)
                .action(action)
                .details(details)
                .build();
        documentActivityRepository.save(activity);
    }
}
