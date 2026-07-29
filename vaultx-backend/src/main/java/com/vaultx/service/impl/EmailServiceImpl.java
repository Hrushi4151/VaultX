package com.vaultx.service.impl;

import com.vaultx.service.EmailService;
import com.vaultx.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final NotificationService notificationService;

    @Override
    public void sendVerificationEmail(String to, String token) {
        log.info("EmailServiceImpl delegating sendVerificationEmail to NotificationService for {}", to);
        notificationService.sendVerificationEmail(to, token);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        log.info("EmailServiceImpl delegating sendPasswordResetEmail to NotificationService for {}", to);
        notificationService.sendPasswordResetEmail(to, token);
    }
}
