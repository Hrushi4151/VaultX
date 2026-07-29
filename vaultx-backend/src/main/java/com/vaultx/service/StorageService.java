package com.vaultx.service;

import java.io.InputStream;

public interface StorageService {
    void uploadFile(String bucketName, String objectName, InputStream inputStream, String contentType);
    InputStream downloadFile(String bucketName, String objectName);
    void deleteFile(String bucketName, String objectName);
}
