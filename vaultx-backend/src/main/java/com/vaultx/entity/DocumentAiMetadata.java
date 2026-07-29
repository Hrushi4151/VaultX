package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "document_ai_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAiMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "detected_category", length = 100)
    private String detectedCategory;

    @Column(name = "detected_type", length = 100)
    private String detectedType;

    @Column(name = "confidence_score", columnDefinition = "numeric(5,2)")
    private Double confidenceScore;

    @Column(name = "extracted_fields_json", columnDefinition = "TEXT")
    private String extractedFieldsJson;

    @Column(name = "tags_json", columnDefinition = "TEXT")
    private String tagsJson;

    @CreationTimestamp
    @Column(name = "processed_at", updatable = false)
    private LocalDateTime processedAt;
}
