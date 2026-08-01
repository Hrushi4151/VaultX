package com.vaultx.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * A scheduled task designed to ping this backend's own public URL every 14 minutes.
 * This prevents free hosting tiers (like Render) from putting the service to sleep
 * due to 15 minutes of inactivity.
 * Outbound requests that route back to the public URL count as inbound external traffic.
 */
@Component
@Slf4j
public class KeepAliveScheduler {

    // Render automatically injects RENDER_EXTERNAL_URL (e.g. https://my-app.onrender.com)
    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    // Fallback for Railway or custom deployments
    @Value("${APP_PUBLIC_URL:}")
    private String appPublicUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // Runs every 14 minutes (840000 ms). Initial delay 5 minutes.
    @Scheduled(fixedRate = 840000, initialDelay = 300000)
    public void pingKeepAlive() {
        String targetUrl = null;

        if (renderExternalUrl != null && !renderExternalUrl.trim().isEmpty()) {
            targetUrl = renderExternalUrl;
        } else if (appPublicUrl != null && !appPublicUrl.trim().isEmpty()) {
            targetUrl = appPublicUrl;
        }

        if (targetUrl != null && !targetUrl.isEmpty()) {
            try {
                // Ensure URL doesn't have a trailing slash
                if (targetUrl.endsWith("/")) {
                    targetUrl = targetUrl.substring(0, targetUrl.length() - 1);
                }
                
                String healthUrl = targetUrl + "/actuator/health";
                log.info("Sending keep-alive ping to prevent sleep: {}", healthUrl);
                
                String response = restTemplate.getForObject(healthUrl, String.class);
                log.debug("Keep-alive ping successful.");
            } catch (Exception e) {
                log.warn("Failed to send keep-alive ping: {}", e.getMessage());
            }
        } else {
            log.debug("Keep-alive ping skipped: No RENDER_EXTERNAL_URL or APP_PUBLIC_URL configured.");
        }
    }
}
