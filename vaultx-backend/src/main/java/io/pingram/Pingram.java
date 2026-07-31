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

import java.nio.charset.StandardCharsets;
import java.util.Base64;
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
            log.info("Sending Pingram Email to: {}", request.getTo());
            try {
                if (!apiKey.equals("mock_pingram_api_key")) {
                    sendEmailRestRequest(request);
                }
            } catch (Exception e) {
                log.error("Error sending Pingram email to {}", request.getTo(), e);
            }
            SendEmailApiResponse resp = new SendEmailApiResponse();
            resp.setTrackingId(java.util.UUID.randomUUID().toString());
            return resp;
        }
    }

    public class SmsClient {
        public SendSmsResponse smsSend(SendSmsRequest request) {
            log.info("Sending Pingram SMS to: {}", request.getTo());
            try {
                if (!apiKey.equals("mock_pingram_api_key")) {
                    sendSmsRestRequest(request);
                }
            } catch (Exception e) {
                log.error("Error sending Pingram SMS to {}", request.getTo(), e);
            }
            SendSmsResponse resp = new SendSmsResponse();
            resp.setTrackingId(java.util.UUID.randomUUID().toString());
            return resp;
        }
    }

    private String extractClientId(String key) {
        try {
            if (key != null && key.contains(".")) {
                String[] parts = key.split("\\.");
                if (parts.length >= 2) {
                    String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                    int idx = payloadJson.indexOf("\"environmentId\":\"");
                    if (idx != -1) {
                        int start = idx + 17;
                        int end = payloadJson.indexOf("\"", start);
                        if (end != -1) return payloadJson.substring(start, end);
                    }
                    idx = payloadJson.indexOf("\"accountId\":\"");
                    if (idx != -1) {
                        int start = idx + 13;
                        int end = payloadJson.indexOf("\"", start);
                        if (end != -1) return payloadJson.substring(start, end);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse environmentId from Pingram key", e);
        }
        return "lguera0ob9w63bchw5ey0d7ywu";
    }

    private void sendEmailRestRequest(SendEmailRequest req) {
        String clientId = extractClientId(apiKey);
        String pingramUrl = "https://api.notificationapi.com/" + clientId + "/sender";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("notificationId", req.getType() != null ? req.getType() : "email_compose_preview");

        Map<String, String> user = new HashMap<>();
        user.put("id", req.getTo());
        user.put("email", req.getTo());
        body.put("user", user);

        Map<String, String> emailObj = new HashMap<>();
        emailObj.put("subject", req.getSubject() != null ? req.getSubject() : "VaultX Verification Code");
        emailObj.put("html", req.getHtml() != null ? req.getHtml() : "<p>Verification code</p>");
        if (req.getFromName() != null) emailObj.put("fromName", req.getFromName());
        if (req.getFromAddress() != null) emailObj.put("fromAddress", req.getFromAddress());
        body.put("email", emailObj);

        Map<String, String> mergeTags = new HashMap<>();
        mergeTags.put("subject", req.getSubject() != null ? req.getSubject() : "");
        mergeTags.put("html", req.getHtml() != null ? req.getHtml() : "");
        body.put("mergeTags", mergeTags);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(pingramUrl, request, String.class);
        log.info("Pingram Email Response [{}]: {}", response.getStatusCode(), response.getBody());
    }

    private void sendSmsRestRequest(SendSmsRequest req) {
        String clientId = extractClientId(apiKey);
        String pingramUrl = "https://api.notificationapi.com/" + clientId + "/sender";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("notificationId", req.getType() != null ? req.getType() : "sms_compose_preview");

        Map<String, String> user = new HashMap<>();
        user.put("id", req.getTo());
        user.put("number", req.getTo());
        body.put("user", user);

        Map<String, String> smsObj = new HashMap<>();
        smsObj.put("message", req.getMessage() != null ? req.getMessage() : "Your verification code.");
        body.put("sms", smsObj);

        Map<String, String> mergeTags = new HashMap<>();
        mergeTags.put("message", req.getMessage() != null ? req.getMessage() : "");
        body.put("mergeTags", mergeTags);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(pingramUrl, request, String.class);
        log.info("Pingram SMS Response [{}]: {}", response.getStatusCode(), response.getBody());
    }
}
