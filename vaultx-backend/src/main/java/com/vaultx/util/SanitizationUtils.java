package com.vaultx.util;

import java.nio.file.Paths;

public class SanitizationUtils {

    /**
     * Prevents path traversal attacks (e.g. ../ or ..\) in uploaded filenames.
     */
    public static String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "unnamed_file";
        }

        // Get single file basename to eliminate path components
        String clean = Paths.get(filename).getFileName().toString();

        // Strip path traversal attempts and control characters
        clean = clean.replaceAll("(?i)\\.\\.[\\\\/]", "")
                     .replaceAll("[\\r\\n\\t\\0]", "")
                     .trim();

        if (clean.isEmpty()) {
            return "unnamed_file";
        }
        return clean;
    }

    /**
     * Strips dangerous XSS script tags and control characters from user text inputs.
     */
    public static String sanitizeText(String input) {
        if (input == null) return null;
        return input.replaceAll("(?i)<script.*?>.*?</script>", "")
                    .replaceAll("(?i)<javascript:.*?>", "")
                    .replaceAll("[\\0]", "")
                    .trim();
    }
}
