package com.vaultx.common;

/**
 * Application-wide string and numeric constants.
 */
public final class AppConstants {

    private AppConstants() {
        throw new UnsupportedOperationException("Utility class — do not instantiate");
    }

    // API versioning
    public static final String API_V1 = "/api/v1";

    // Security roles
    public static final String ROLE_USER = "ROLE_USER";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    // Security context
    public static final String ANONYMOUS_USER = "anonymousUser";
    public static final String SYSTEM_USER = "system";

    // Pagination defaults
    public static final int DEFAULT_PAGE_NUMBER = 0;
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    // Sorting defaults
    public static final String DEFAULT_SORT_FIELD = "createdAt";
    public static final String DEFAULT_SORT_DIRECTION = "DESC";

    // Date/time
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
    public static final String DISPLAY_DATETIME_FORMAT = "dd MMM yyyy, HH:mm";
}
