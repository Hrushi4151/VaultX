package com.vaultx.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT configuration properties bound from application.yml (prefix: vaultx.jwt).
 */
@Configuration
@ConfigurationProperties(prefix = "vaultx.jwt")
@Getter
@Setter
public class JwtConfig {

    /** Base64-encoded HMAC-SHA256 signing secret (min 256 bits). */
    private String secret;

    /** Access token TTL in milliseconds (default: 24h = 86400000). */
    private long expiration;

    /** Refresh token TTL in milliseconds (default: 7d = 604800000). */
    private long refreshExpiration;

    /** Authorization header prefix (default: "Bearer "). */
    private String tokenPrefix = "Bearer ";

    /** HTTP header carrying the JWT (default: "Authorization"). */
    private String headerName = "Authorization";
}
