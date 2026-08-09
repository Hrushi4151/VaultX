package com.vaultx.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Enterprise Ultra-Secure Biometric Face Matcher
 * Uses the dedicated VaultX Python AI Microservice (DeepFace) for matching.
 */
@Component
@Slf4j
public class FaceBiometricMatcher {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @org.springframework.beans.factory.annotation.Value("${vaultx.ai.service.url:http://localhost:8001}")
    private String aiServiceUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();

    @PostConstruct
    public void init() {
        log.info("==================================================================");
        log.info("🛡️ VaultX Ultra-Secure Biometric Face Engine (Python Microservice) Initialized!");
        log.info("==================================================================");
    }

    /**
     * Verifies if candidate face snapshot matches registered face snapshot.
     */
    public boolean isFaceMatch(String registeredBase64, String candidateBase64) {
        if (registeredBase64 == null || candidateBase64 == null || registeredBase64.isBlank() || candidateBase64.isBlank()) {
            log.warn("Face matching aborted: Missing face sample data.");
            return false;
        }

        try {
            String cleanReg = cleanBase64(registeredBase64);
            String cleanCand = cleanBase64(candidateBase64);

            Map<String, String> requestBody = Map.of(
                    "registeredImage", cleanReg,
                    "candidateImage", cleanCand
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            String baseUrl = aiServiceUrl.trim();
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }
            String url = baseUrl + "/api/v1/ai/face-match";
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                boolean isMatch = root.path("match").asBoolean(false);
                double confidence = root.path("confidence").asDouble(0.0);
                String reason = root.path("reason").asText();
                
                log.info("🛡️ Local AI Microservice Face Match Decision: {} | Confidence: {} | Reason: {}", 
                        isMatch, String.format("%.2f", confidence), reason);
                return isMatch;
            } else {
                log.warn("Python AI Service HTTP Response: {}", response.getStatusCode());
                if (response.getBody() != null) {
                    log.warn("Response body: {}", response.getBody());
                }
            }
        } catch (Exception e) {
            log.error("Error executing Python AI Microservice face comparison: {}", e.getMessage());
        }
        
        return false;
    }

    private String cleanBase64(String input) {
        if (input.contains(",")) {
            return input.split(",")[1].trim();
        }
        return input.trim();
    }
}
