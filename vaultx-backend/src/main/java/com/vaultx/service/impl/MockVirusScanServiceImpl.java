package com.vaultx.service.impl;

import com.vaultx.service.VirusScanService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@Slf4j
public class MockVirusScanServiceImpl implements VirusScanService {

    @Override
    public boolean isClean(InputStream inputStream) {
        log.debug("Mock virus scan executing... file is clean.");
        // In a real scenario, this would stream the file to ClamAV or similar.
        // For now, always return true.
        return true;
    }
}
