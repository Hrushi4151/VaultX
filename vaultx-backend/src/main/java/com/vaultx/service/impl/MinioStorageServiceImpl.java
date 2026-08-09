package com.vaultx.service.impl;

import com.vaultx.exception.BusinessException;
import com.vaultx.service.StorageService;
import io.minio.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@Slf4j
@RequiredArgsConstructor
public class MinioStorageServiceImpl implements StorageService {

    @Value("${vaultx.minio.url}")
    private String minioUrl;

    @Value("${vaultx.minio.access-key}")
    private String accessKey;

    @Value("${vaultx.minio.secret-key}")
    private String secretKey;
    
    @Value("${vaultx.minio.bucket-name}")
    private String defaultBucketName;

    private MinioClient minioClient;
    private boolean isMinioAvailable = false;
    private final Path localStorageDir = Paths.get("uploads").toAbsolutePath().normalize();

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(localStorageDir);
        } catch (Exception e) {
            log.warn("Failed to create local storage directory: {}", e.getMessage());
        }

        try {
            minioClient = MinioClient.builder()
                    .endpoint(minioUrl)
                    .credentials(accessKey, secretKey)
                    .build();
            
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(defaultBucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(defaultBucketName).build());
                log.info("Created MinIO bucket: {}", defaultBucketName);
            }
            isMinioAvailable = true;
            log.info("MinIO / R2 Object Storage successfully initialized at {}", minioUrl);
        } catch (Exception e) {
            isMinioAvailable = false;
            log.warn("MinIO / R2 storage unavailable ({}). Defaulting to Local Disk Storage at {}", e.getMessage(), localStorageDir);
        }
    }

    @Override
    public void uploadFile(String bucketName, String objectName, InputStream inputStream, String contentType) {
        if (isMinioAvailable && minioClient != null) {
            try {
                minioClient.putObject(
                    PutObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .stream(inputStream, -1, 10485760) // Part size 10MB
                        .contentType(contentType)
                        .build()
                );
                log.debug("Successfully uploaded {} to MinIO bucket {}", objectName, bucketName);
                return;
            } catch (Exception e) {
                log.warn("MinIO upload failed ({}), falling back to local disk storage...", e.getMessage());
            }
        }

        // Resilient Local Disk Storage Fallback
        try {
            Path targetPath = localStorageDir.resolve(objectName).normalize();
            Files.createDirectories(targetPath.getParent());
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Successfully saved {} to local disk storage at {}", objectName, targetPath);
        } catch (Exception e) {
            log.error("Failed to save file to local disk storage", e);
            throw new BusinessException("Failed to upload document to storage");
        }
    }

    @Override
    public InputStream downloadFile(String bucketName, String objectName) {
        if (isMinioAvailable && minioClient != null) {
            try {
                return minioClient.getObject(
                    GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
                );
            } catch (Exception e) {
                log.warn("MinIO download failed ({}), falling back to local disk storage...", e.getMessage());
            }
        }

        // Resilient Local Disk Storage Fallback
        try {
            Path targetPath = localStorageDir.resolve(objectName).normalize();
            File file = targetPath.toFile();
            if (!file.exists()) {
                throw new BusinessException("Document file not found on storage");
            }
            return new FileInputStream(file);
        } catch (BusinessException be) {
            throw be;
        } catch (Exception e) {
            log.error("Failed to read file from local storage", e);
            throw new BusinessException("Failed to download document from storage");
        }
    }

    @Override
    public void deleteFile(String bucketName, String objectName) {
        if (isMinioAvailable && minioClient != null) {
            try {
                minioClient.removeObject(
                    RemoveObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectName)
                        .build()
                );
                log.debug("Successfully deleted {} from MinIO bucket {}", objectName, bucketName);
            } catch (Exception e) {
                log.warn("MinIO deletion failed ({}), falling back to local disk storage...", e.getMessage());
            }
        }

        // Resilient Local Disk Storage Fallback
        try {
            Path targetPath = localStorageDir.resolve(objectName).normalize();
            Files.deleteIfExists(targetPath);
            log.info("Successfully deleted {} from local storage", objectName);
        } catch (Exception e) {
            log.warn("Failed to delete file from local storage: {}", e.getMessage());
        }
    }
}
