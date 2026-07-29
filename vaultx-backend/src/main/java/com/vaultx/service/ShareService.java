package com.vaultx.service;

import com.vaultx.common.PagedResponse;
import com.vaultx.dto.share.ShareCreateRequest;
import com.vaultx.dto.share.ShareDto;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ShareService {
    ShareDto createShare(ShareCreateRequest request);
    PagedResponse<ShareDto> getUserShares(Pageable pageable);
    ShareDto getShare(UUID id);
    void revokeShare(UUID id);
    void deleteShare(UUID id);
    void updatePassword(UUID id, String newPassword);
}
