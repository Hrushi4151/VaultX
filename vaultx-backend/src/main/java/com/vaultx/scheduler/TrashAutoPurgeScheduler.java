package com.vaultx.scheduler;

import com.vaultx.entity.Document;
import com.vaultx.entity.User;
import com.vaultx.repository.DocumentRepository;
import com.vaultx.service.DocumentActivityService;
import com.vaultx.service.InAppNotificationService;
import com.vaultx.service.NotificationService;
import com.vaultx.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TrashAutoPurgeScheduler {

    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final InAppNotificationService inAppNotificationService;
    private final DocumentActivityService activityService;
    private final StorageService storageService;

    /**
     * Scheduled task to process trash expiries every hour.
     * Checks for:
     * 1. 7-Day Expiry Reminders (Email + SMS + In-App)
     * 2. 1-Day Expiry Reminders (Email + SMS + In-App)
     * 3. 30-Day Permanent Auto-Purge
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void processTrashExpiriesAndPurges() {
        log.info("⏰ Running 30-Day Trash Expiry & Auto-Purge Scheduler...");
        LocalDateTime now = LocalDateTime.now();

        List<Document> trashedDocs = documentRepository.findByDeletedTrue();
        if (trashedDocs.isEmpty()) {
            log.info("No trashed documents found for expiry processing.");
            return;
        }

        for (Document doc : trashedDocs) {
            try {
                LocalDateTime deletedAt = doc.getDeletedAt();
                if (deletedAt == null) {
                    deletedAt = doc.getUpdatedAt() != null ? doc.getUpdatedAt() : doc.getCreatedAt();
                    doc.setDeletedAt(deletedAt);
                }

                long daysInTrash = ChronoUnit.DAYS.between(deletedAt, now);
                long daysRemaining = 30 - daysInTrash;

                User owner = doc.getOwner();
                String email = owner != null ? owner.getEmail() : null;
                String phone = owner != null ? owner.getPhoneNumber() : null;
                String userName = owner != null ? (owner.getFirstName() != null ? owner.getFirstName() : owner.getUsername()) : "User";

                // 1. Check 30-Day Auto-Purge
                if (daysInTrash >= 30 || daysRemaining <= 0) {
                    log.info("PERMANENT PURGE: Document '{}' (ID: {}) exceeded 30 days in Trash. Purging permanently...", doc.getDisplayName(), doc.getId());
                    
                    // Send Email + SMS + In-App Notifications
                    notificationService.sendTrashPermanentDeletionNotification(email, phone, userName, doc.getDisplayName());
                    inAppNotificationService.createNotification(owner, "🗑️ Document Purged", "Document '" + doc.getDisplayName() + "' was permanently purged after 30 days in Trash.", "TRASH_WARNING", "/dashboard/trash");
                    activityService.logActivity(doc, owner, "PERMANENT_DELETE_AUTOMATIC", "Automatically purged after 30 days in trash");

                    // Delete file from storage
                    try {
                        storageService.deleteFile(doc.getBucketName(), doc.getStoragePath());
                    } catch (Exception e) {
                        log.warn("Could not delete physical storage file for document ID: {}", doc.getId(), e);
                    }

                    documentRepository.delete(doc);
                    continue;
                }

                // 2. Check 7-Day Expiry Reminder (when <= 7 days remaining and not yet notified)
                if (daysRemaining <= 7 && daysRemaining > 1 && !doc.isNotified7d()) {
                    log.info("NOTIFICATION (7-Day Expiry): Document '{}' has {} days left in Trash.", doc.getDisplayName(), daysRemaining);
                    notificationService.sendTrashExpiryReminder(email, phone, userName, doc.getDisplayName(), (int) daysRemaining);
                    inAppNotificationService.createNotification(owner, "⚠️ Trash Expiry Alert", "Document '" + doc.getDisplayName() + "' will be permanently deleted in " + daysRemaining + " day(s).", "TRASH_WARNING", "/dashboard/trash");
                    activityService.logActivity(doc, owner, "TRASH_EXPIRY_WARNING_7D", "7-day trash expiry reminder sent via Email & SMS");
                    doc.setNotified7d(true);
                    documentRepository.save(doc);
                }

                // 3. Check 1-Day Expiry Reminder (when <= 1 day remaining and not yet notified)
                if (daysRemaining <= 1 && !doc.isNotified1d()) {
                    log.info("NOTIFICATION (1-Day Expiry): Document '{}' has 1 day left in Trash.", doc.getDisplayName());
                    notificationService.sendTrashExpiryReminder(email, phone, userName, doc.getDisplayName(), 1);
                    inAppNotificationService.createNotification(owner, "🚨 Final Expiry Alert", "Document '" + doc.getDisplayName() + "' will be permanently deleted in 1 day!", "TRASH_WARNING", "/dashboard/trash");
                    activityService.logActivity(doc, owner, "TRASH_EXPIRY_WARNING_1D", "1-day final trash expiry reminder sent via Email & SMS");
                    doc.setNotified1d(true);
                    documentRepository.save(doc);
                }

            } catch (Exception e) {
                log.error("Error processing trash expiry for document ID: {}", doc.getId(), e);
            }
        }
    }
}
