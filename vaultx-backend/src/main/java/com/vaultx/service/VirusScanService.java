package com.vaultx.service;

import java.io.InputStream;

public interface VirusScanService {
    boolean isClean(InputStream inputStream);
}
