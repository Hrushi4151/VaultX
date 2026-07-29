package com.vaultx.service;

import com.vaultx.dto.share.PublicShareMetadataDto;

import java.io.InputStream;

public interface PublicShareService {
    PublicShareMetadataDto getPublicMetadata(String token, String ipAddress, String userAgent);
    boolean verifyPassword(String token, String password);
    InputStream downloadShare(String token, String password, String ipAddress, String userAgent) throws Exception;
    
    java.util.List<com.vaultx.dto.share.PublicDocumentDto> getShareDocuments(String token, String password, String ipAddress, String userAgent);
    InputStream downloadSingleDocument(String token, String docId, String password, String ipAddress, String userAgent) throws Exception;
}
