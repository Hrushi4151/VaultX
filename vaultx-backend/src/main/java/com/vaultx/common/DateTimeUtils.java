package com.vaultx.common;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Date and time utility methods.
 */
public final class DateTimeUtils {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final DateTimeFormatter DISPLAY_FORMATTER =
            DateTimeFormatter.ofPattern(AppConstants.DISPLAY_DATETIME_FORMAT);

    private DateTimeUtils() {
        throw new UnsupportedOperationException("Utility class — do not instantiate");
    }

    public static String formatForDisplay(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(DISPLAY_FORMATTER);
    }

    public static String formatIso(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        return dateTime.format(ISO_FORMATTER);
    }

    public static long toEpochMillis(LocalDateTime dateTime) {
        if (dateTime == null) return 0L;
        return dateTime.toInstant(ZoneOffset.UTC).toEpochMilli();
    }

    public static LocalDateTime now() {
        return LocalDateTime.now();
    }

    public static boolean isExpired(LocalDateTime expiryTime) {
        if (expiryTime == null) return true;
        return LocalDateTime.now().isAfter(expiryTime);
    }
}
