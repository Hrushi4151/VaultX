package io.pingram;

import io.pingram.model.SendEmailRequest;
import io.pingram.model.SendEmailApiResponse;
import io.pingram.model.SendSmsRequest;
import io.pingram.model.SendSmsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

public class Pingram {
    private static final Logger log = LoggerFactory.getLogger(Pingram.class);
    private final String apiKey;
    private final EmailClient emailClient;
    private final SmsClient smsClient;
    private final RestTemplate restTemplate = new RestTemplate();

    public Pingram(String apiKey) {
        this.apiKey = apiKey;
        this.emailClient = new EmailClient();
        this.smsClient = new SmsClient();
    }

    public EmailClient getEmail() {
        return emailClient;
    }

    public SmsClient getSms() {
        return smsClient;
    }

    public class EmailClient {
        public SendEmailApiResponse emailSend(SendEmailRequest request) {
            log.info("Sending Pingram Email via REST mapping...");
            try {
                if (!apiKey.equals("mock_pingram_api_key")) {
                    sendRestRequest(request.getTo(), request.getType(), Map.of(
                        "subject", request.getSubject() != null ? request.getSubject() : "",
                        "html", request.getHtml() != null ? request.getHtml() : ""
                    ));
                }
            } catch (Exception e) {
                log.error("Error sending Pingram email", e);
            }
            return new SendEmailApiResponse();
        }
    }

    public class SmsClient {
        public SendSmsResponse smsSend(SendSmsRequest request) {
            log.info("Sending Pingram SMS via REST mapping...");
            try {
                if (!apiKey.equals("mock_pingram_api_key")) {
                    sendRestRequest(request.getTo(), request.getType(), Map.of(
                        "message", request.getMessage() != null ? request.getMessage() : ""
                    ));
                }
            } catch (Exception e) {
                log.error("Error sending Pingram SMS", e);
            }
            return new SendSmsResponse();
        }
    }

    private void sendRestRequest(String recipient, String notificationId, Map<String, String> mergeTags) {
        String[] parts = apiKey.split("\\.");
        // Usually an API key is base64 encoded or token based. For this mock we just use it directly.
        String clientId = apiKey.length() > 20 ? apiKey.substring(0, 20) : apiKey;
        
        String pingramUrl = "https://api.notificationapi.com/" + clientId + "/sender";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("notificationId", notificationId);
        
        Map<String, String> user = new HashMap<>();
        user.put("id", recipient);
        
        if (recipient.contains("@")) {
            user.put("email", recipient);
        } else {
            user.put("number", recipient);
        }
        
        body.put("user", user);
        body.put("mergeTags", mergeTags);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        restTemplate.postForEntity(pingramUrl, request, String.class);
    }
}
