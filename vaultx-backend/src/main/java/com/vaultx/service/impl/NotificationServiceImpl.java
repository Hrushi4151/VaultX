package com.vaultx.service.impl;

import com.vaultx.service.NotificationService;
import io.pingram.Pingram;
import io.pingram.model.SendEmailApiResponse;
import io.pingram.model.SendEmailRequest;
import io.pingram.model.SendSmsRequest;
import io.pingram.model.SendSmsResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    @Value("${vaultx.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${vaultx.pingram.api-key:pingram_sk_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJrZXlfM2M3YTdiNjFkODZjZTEwYzNiZWYwZmE4NGJlYjU0ZWIiLCJ2ZXJzaW9uIjoxLCJhY2NvdW50SWQiOiJsZ3VlcmEwb2I5dzYzYmNodzVleTBkN3l3dSIsImtleVR5cGUiOiJzZWNyZXQiLCJlbnZpcm9ubWVudElkIjoibGd1ZXJhMG9iOXc2M2JjaHc1ZXkwZDd5d3UifQ.82RRX5wbb0-UvImvx7Yyv1YCB3FAl5IzZpVrDKYLyQQ}")
    private String pingramApiKey;

    private static final String DEFAULT_PINGRAM_KEY = "pingram_sk_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJrZXlfM2M3YTdiNjFkODZjZTEwYzNiZWYwZmE4NGJlYjU0ZWIiLCJ2ZXJzaW9uIjoxLCJhY2NvdW50SWQiOiJsZ3VlcmEwb2I5dzYzYmNodzVleTBkN3l3dSIsImtleVR5cGUiOiJzZWNyZXQiLCJlbnZpcm9ubWVudElkIjoibGd1ZXJhMG9iOXc2M2JjaHc1ZXkwZDd5d3UifQ.82RRX5wbb0-UvImvx7Yyv1YCB3FAl5IzZpVrDKYLyQQ";

    private Pingram pingram;

    @PostConstruct
    public void init() {
        String key = (pingramApiKey != null && !pingramApiKey.isBlank()) ? pingramApiKey.trim() : DEFAULT_PINGRAM_KEY;
        this.pingram = new Pingram(key);
        log.info("Initialized Pingram Notification Service with API key ending in '...{}'", key.substring(Math.max(0, key.length() - 10)));
    }

    private String formatPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String clean = phone.trim().replaceAll("[^0-9+]", "");
        if (!clean.startsWith("+")) {
            clean = "+91" + clean;
        }
        return clean;
    }

    @Override
    public void sendEmailOtp(String to, String otp) {
        log.info("==================================================================");
        log.info("PINGRAM EMAIL OTP SENDER");
        log.info("Sending OTP Email to: {}", to);
        log.info("==================================================================");

        try {
            SendEmailRequest body = new SendEmailRequest()
                .type("email_compose_preview")
                .to(to)
                .subject("Your verification code")
                .html("<p>Your verification code is <strong>" + otp + "</strong></p>")
                .fromName("Pingram")
                .fromAddress("noreply@pingram.io");
            
            SendEmailApiResponse response = pingram.getEmail().emailSend(body);
            log.info("Pingram Email OTP sent successfully to {}. Tracking ID: {}", to, response.getTrackingId());
        } catch (Exception e) {
            log.error("Failed to send Pingram Email OTP to {}", to, e);
        }
    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        String verificationUrl = frontendUrl + "/verify-email?token=" + token;
        
        log.info("==================================================================");
        log.info("PINGRAM EMAIL NOTIFICATION (Verification)");
        log.info("To: {}", to);
        log.info("Subject: Verify your VaultX account");
        log.info("Verification URL: {}", verificationUrl);
        log.info("==================================================================");

        try {
            SendEmailRequest body = new SendEmailRequest()
                .type("email_compose_preview")
                .to(to)
                .subject("Verify your VaultX account")
                .html("<p>Your verification link is: <a href=\"" + verificationUrl + "\"><strong>" + verificationUrl + "</strong></a></p>")
                .fromName("Pingram")
                .fromAddress("noreply@pingram.io");
            
            SendEmailApiResponse response = pingram.getEmail().emailSend(body);
            log.info("Pingram Verification Email sent successfully. Tracking ID: {}", response.getTrackingId());
        } catch (Exception e) {
            log.error("Failed to send Pingram verification email to {}", to, e);
        }
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        
        log.info("==================================================================");
        log.info("PINGRAM EMAIL NOTIFICATION (Password Reset)");
        log.info("To: {}", to);
        log.info("Reset URL: {}", resetUrl);
        log.info("==================================================================");

        try {
            SendEmailRequest body = new SendEmailRequest()
                .type("email_compose_preview")
                .to(to)
                .subject("Reset your VaultX password")
                .html("<p>Your password reset link is: <a href=\"" + resetUrl + "\"><strong>" + resetUrl + "</strong></a></p>")
                .fromName("Pingram")
                .fromAddress("noreply@pingram.io");
            
            SendEmailApiResponse response = pingram.getEmail().emailSend(body);
            log.info("Pingram Password Reset Email sent successfully. Tracking ID: {}", response.getTrackingId());
        } catch (Exception e) {
            log.error("Failed to send Pingram password reset email to {}", to, e);
        }
    }

    @Override
    public void sendSmsOtp(String phoneNumber, String otp) {
        String formattedPhone = formatPhoneNumber(phoneNumber);
        log.info("==================================================================");
        log.info("PINGRAM SMS NOTIFICATION");
        log.info("Sending SMS OTP to Formatted Phone: {}", formattedPhone);
        log.info("==================================================================");

        if (formattedPhone == null) {
            log.warn("Cannot send SMS OTP: phone number is null or empty");
            return;
        }

        try {
            SendSmsRequest body = new SendSmsRequest()
                .type("sms_compose_preview")
                .to(formattedPhone)
                .message("Your verification code is: " + otp + ". Reply STOP to opt-out.");
            
            SendSmsResponse response = pingram.getSms().smsSend(body);
            log.info("Pingram SMS sent successfully to {}. Tracking ID: {}", formattedPhone, response.getTrackingId());
        } catch (Exception e) {
            log.error("Failed to send Pingram SMS notification to {}", formattedPhone, e);
        }
    }

    @Override
    public void sendTrashExpiryReminder(String email, String phone, String userName, String documentName, int daysRemaining) {
        String subject = "Your verification code: Trash Expiry Alert";
        log.info("==================================================================");
        log.info("TRASH EXPIRY REMINDER NOTIFICATION (Email & SMS)");
        log.info("User: {} | Email: {} | Phone: {}", userName, email, phone);
        log.info("Document: {} | Days Remaining: {}", documentName, daysRemaining);
        log.info("==================================================================");

        if (email != null && !email.isBlank()) {
            try {
                SendEmailRequest body = new SendEmailRequest()
                    .type("email_compose_preview")
                    .to(email)
                    .subject("⚠️ VaultX Trash Alert: '" + documentName + "' expires in " + daysRemaining + " day(s)")
                    .html("<p>Hello <strong>" + userName + "</strong>,</p><p>Your document <strong>\"" + documentName + "\"</strong> in VaultX Trash will be permanently deleted in <strong>" + daysRemaining + " day(s)</strong>.</p>")
                    .fromName("Pingram")
                    .fromAddress("noreply@pingram.io");
                SendEmailApiResponse response = pingram.getEmail().emailSend(body);
                log.info("Trash Expiry Email sent successfully. Tracking ID: {}", response.getTrackingId());
            } catch (Exception e) {
                log.error("Failed to send Pingram email for trash expiry", e);
            }
        }

        String formattedPhone = formatPhoneNumber(phone);
        if (formattedPhone != null) {
            try {
                SendSmsRequest body = new SendSmsRequest()
                    .type("sms_compose_preview")
                    .to(formattedPhone)
                    .message("VaultX Alert: Your document '" + documentName + "' in Trash will be permanently deleted in " + daysRemaining + " day(s). Reply STOP to opt-out.");
                SendSmsResponse response = pingram.getSms().smsSend(body);
                log.info("Trash Expiry SMS sent successfully. Tracking ID: {}", response.getTrackingId());
            } catch (Exception e) {
                log.error("Failed to send Pingram SMS for trash expiry", e);
            }
        }
    }

    @Override
    public void sendTrashPermanentDeletionNotification(String email, String phone, String userName, String documentName) {
        log.info("==================================================================");
        log.info("TRASH PERMANENT PURGE NOTIFICATION (Email & SMS)");
        log.info("User: {} | Email: {} | Document: {}", userName, email, documentName);
        log.info("==================================================================");

        if (email != null && !email.isBlank()) {
            try {
                SendEmailRequest body = new SendEmailRequest()
                    .type("email_compose_preview")
                    .to(email)
                    .subject("🗑️ VaultX Notice: '" + documentName + "' permanently deleted")
                    .html("<p>Hello <strong>" + userName + "</strong>,</p><p>Your document <strong>\"" + documentName + "\"</strong> was permanently purged after 30 days in Trash.</p>")
                    .fromName("Pingram")
                    .fromAddress("noreply@pingram.io");
                SendEmailApiResponse response = pingram.getEmail().emailSend(body);
                log.info("Purge Notice Email sent successfully. Tracking ID: {}", response.getTrackingId());
            } catch (Exception e) {
                log.error("Failed to send Pingram purge email", e);
            }
        }

        String formattedPhone = formatPhoneNumber(phone);
        if (formattedPhone != null) {
            try {
                SendSmsRequest body = new SendSmsRequest()
                    .type("sms_compose_preview")
                    .to(formattedPhone)
                    .message("VaultX Notice: Your document '" + documentName + "' was permanently purged from Trash after 30 days. Reply STOP to opt-out.");
                SendSmsResponse response = pingram.getSms().smsSend(body);
                log.info("Purge Notice SMS sent successfully. Tracking ID: {}", response.getTrackingId());
            } catch (Exception e) {
                log.error("Failed to send Pingram SMS for purge notice", e);
            }
        }
    }
}
