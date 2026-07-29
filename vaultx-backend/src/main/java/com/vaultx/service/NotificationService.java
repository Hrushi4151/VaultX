package com.vaultx.service;

public interface NotificationService {
    void sendEmailOtp(String to, String otp);
    void sendVerificationEmail(String to, String token);
    void sendPasswordResetEmail(String to, String token);
    void sendSmsOtp(String phoneNumber, String otp);
    void sendTrashExpiryReminder(String email, String phone, String userName, String documentName, int daysRemaining);
    void sendTrashPermanentDeletionNotification(String email, String phone, String userName, String documentName);
}
