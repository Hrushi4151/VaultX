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
    private String detectionType; // EXACT_CHECKSUM, OCR_TEXT_EXACT, OCR_TEXT_SIMILAR, FILENAME_MATCH
    private Double similarityPercentage;
    private String matchReason;
    private List<DocumentDto> documents;
}
