package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ocr_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(length = 10)
    private String language;

    @Column(columnDefinition = "numeric(5,2)")
    private Double confidence;

    @Column(length = 50)
    private String status;

    @CreationTimestamp
    @Column(name = "processed_at", updatable = false)
    private LocalDateTime processedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
