package com.vaultx.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3 / Swagger UI configuration with JWT Bearer authentication scheme.
 */
@Configuration
public class OpenApiConfig {

    @Value("${vaultx.app.version:1.0.0}")
    private String appVersion;

    @Bean
    public OpenAPI vaultXOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("VaultX API")
                        .description("""
                                **VaultX** — Your Secure Digital Document Vault.
                                
                                Enterprise-grade document management platform REST API.
                                
                                **Authentication:** Use the Authorize button to provide a Bearer JWT token.
                                """)
                        .version(appVersion)
                        .contact(new Contact()
                                .name("VaultX Team")
                                .email("support@vaultx.io")
                                .url("https://vaultx.io"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://vaultx.io/license")))
                .servers(List.of(
                        new Server().url("/").description("Current Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .name("bearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter your JWT token obtained from the authentication endpoint.")));
    }
}
