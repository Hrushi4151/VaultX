package com.vaultx.service.impl;

import com.vaultx.exception.BusinessException;
import com.vaultx.service.StorageService;
import io.minio.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;

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

    @PostConstruct
    public void init() {
        try {
            minioClient = MinioClient.builder()
                    .endpoint(minioUrl)
                    .credentials(accessKey, secretKey)
                    .build();
            
            // Ensure default bucket exists
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(defaultBucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(defaultBucketName).build());
                log.info("Created MinIO bucket: {}", defaultBucketName);
            }
        } catch (Exception e) {
            log.error("Failed to initialize MinIO client. Storage features will be unavailable.", e);
        }
    }

    @Override
    public void uploadFile(String bucketName, String objectName, InputStream inputStream, String contentType) {
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(inputStream, -1, 10485760) // Part size 10MB
                    .contentType(contentType)
                    .build()
            );
            log.debug("Successfully uploaded {} to bucket {}", objectName, bucketName);
        } catch (Exception e) {
            log.error("Error uploading file to MinIO", e);
            throw new BusinessException("Failed to upload document to storage");
        }
    }

    @Override
    public InputStream downloadFile(String bucketName, String objectName) {
        try {
            return minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
            );
        } catch (Exception e) {
            log.error("Error downloading file from MinIO", e);
            throw new BusinessException("Failed to download document from storage");
        }
    }

    @Override
    public void deleteFile(String bucketName, String objectName) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
            );
            log.debug("Successfully deleted {} from bucket {}", objectName, bucketName);
        } catch (Exception e) {
            log.error("Error deleting file from MinIO", e);
            throw new BusinessException("Failed to delete document from storage");
        }
    }
}
