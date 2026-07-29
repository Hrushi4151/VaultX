package com.vaultx.mapper;

import com.vaultx.dto.share.ShareDto;
import com.vaultx.entity.Share;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.stream.Collectors;
import com.vaultx.entity.ShareFile;
import com.vaultx.dto.document.DocumentDto;

@Mapper(componentModel = "spring")
public abstract class ShareMapper {
    
    @Autowired
    protected DocumentMapper documentMapper;

    @Mapping(target = "isPasswordProtected", expression = "java(share.getHashedPassword() != null)")
    @Mapping(target = "isActive", source = "active")
    @Mapping(target = "documents", expression = "java(mapShareFiles(share.getShareFiles()))")
    public abstract ShareDto toDto(Share share);
    
    protected List<DocumentDto> mapShareFiles(List<ShareFile> shareFiles) {
        if (shareFiles == null) return null;
        return shareFiles.stream()
                .map(ShareFile::getDocument)
                .map(documentMapper::toDto)
                .collect(Collectors.toList());
    }
}

