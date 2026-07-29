package com.vaultx.service;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.Map;

public interface PdfProcessingService {
    
    /**
     * Merges multiple PDF input streams into a single output stream.
     */
    void mergePdfs(List<InputStream> sources, OutputStream output) throws Exception;

    /**
     * Converts a list of image input streams to a single PDF output stream.
     */
    void imagesToPdf(List<InputStream> imageSources, OutputStream output) throws Exception;

    /**
     * Generates a professional cover page.
     */
    InputStream generateCoverPage(String title, String description, String ownerName, int documentCount) throws Exception;

    /**
     * Generates a Table of Contents based on document titles.
     */
    InputStream generateTableOfContents(List<String> documentTitles) throws Exception;

    /**
     * Stamps page numbers on an existing PDF.
     */
    void addPageNumbers(InputStream source, OutputStream output, String position) throws Exception;

    /**
     * Stamps a diagonal watermark on an existing PDF.
     */
    void addWatermark(InputStream source, OutputStream output, String text) throws Exception;

    /**
     * Encrypts the PDF with owner/user passwords and permissions.
     */
    void encryptPdf(InputStream source, OutputStream output, String ownerPwd, String userPwd, 
                    boolean allowPrint, boolean allowCopy, boolean allowEdit) throws Exception;

    /**
     * Overlays a signature image on specified pages of a PDF document.
     */
    void addSignatureOverlay(InputStream source, OutputStream output, String imageBase64, String position) throws Exception;

    /**
     * Extracts a list of specific pages (1-indexed) from a PDF input stream.
     */
    void extractPages(InputStream source, List<Integer> pageNumbers, OutputStream output) throws Exception;
}
