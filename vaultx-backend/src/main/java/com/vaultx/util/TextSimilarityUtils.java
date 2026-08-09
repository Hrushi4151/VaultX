package com.vaultx.util;

import java.util.*;

public class TextSimilarityUtils {

    /**
     * Normalizes raw OCR text for reliable comparison.
     * Lowercases, strips punctuation, and collapses extra whitespace.
     */
    public static String normalizeText(String rawText) {
        if (rawText == null) return "";
        return rawText.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Extracts word bi-grams for containment & similarity matching.
     */
    public static Set<String> getWordBigrams(String normalizedText) {
        if (normalizedText == null || normalizedText.trim().isEmpty()) {
            return Collections.emptySet();
        }
        String[] words = normalizedText.split(" ");
        if (words.length < 2) {
            return new HashSet<>(Arrays.asList(words));
        }
        Set<String> bigrams = new HashSet<>();
        for (int i = 0; i < words.length - 1; i++) {
            if (words[i].length() > 1 || words[i+1].length() > 1) {
                bigrams.add(words[i] + " " + words[i + 1]);
            }
        }
        return bigrams;
    }

    /**
     * Calculates Containment & Jaccard Hybrid Similarity Score (0.0 to 1.0).
     */
    public static double calculateSimilarity(String text1, String text2) {
        String norm1 = normalizeText(text1);
        String norm2 = normalizeText(text2);

        if (norm1.isEmpty() || norm2.isEmpty()) return 0.0;
        if (norm1.equals(norm2)) return 1.0;

        Set<String> set1 = getWordBigrams(norm1);
        Set<String> set2 = getWordBigrams(norm2);

        if (set1.isEmpty() || set2.isEmpty()) {
            // Fallback to word-level overlap
            Set<String> words1 = new HashSet<>(Arrays.asList(norm1.split(" ")));
            Set<String> words2 = new HashSet<>(Arrays.asList(norm2.split(" ")));
            return calculateOverlapScore(words1, words2);
        }

        return calculateOverlapScore(set1, set2);
    }

    private static double calculateOverlapScore(Set<String> set1, Set<String> set2) {
        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        if (intersection.isEmpty()) return 0.0;

        int minSize = Math.min(set1.size(), set2.size());

        // Containment Ratio (handles partial/cropped document scans)
        double containment = (double) intersection.size() / minSize;
        // Jaccard Ratio
        double jaccard = (double) intersection.size() / (set1.size() + set2.size() - intersection.size());

        // Weighted hybrid score
        return (containment * 0.7) + (jaccard * 0.3);
    }
}
