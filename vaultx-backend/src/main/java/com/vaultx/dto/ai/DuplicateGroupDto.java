package com.vaultx.dto.ai;

import com.vaultx.dto.document.DocumentDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateGroupDto {
    private String checksum;
    private String fileName;
    private long fileSize;
    private int duplicateCount;
    private long wastedBytes;
    private List<DocumentDto> documents;
}
