package com.vaultx.service;

import com.vaultx.entity.Document;
import java.util.List;
import java.util.UUID;

public interface DuplicateDetectionService {
    List<Document> findExactDuplicates(String checksum);
    List<Document> findDuplicatesByName(String displayName);
}
