package com.vaultx.service;

import com.vaultx.entity.Document;
import com.vaultx.entity.User;

import java.util.UUID;

public interface DocumentActivityService {
    void logActivity(Document document, User user, String action, String details);
}
