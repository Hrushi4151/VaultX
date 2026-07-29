package com.vaultx.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    // Basic in-memory concurrent map cache is provided out-of-the-box by Spring Boot.
    // If Redis was in the classpath, Spring would auto-configure RedisCacheManager.
}
