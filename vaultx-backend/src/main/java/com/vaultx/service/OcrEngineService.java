package com.vaultx.service;

import java.util.UUID;

public interface OcrEngineService {
    void processDocument(UUID documentId);
    void reprocessDocument(UUID documentId);
}
