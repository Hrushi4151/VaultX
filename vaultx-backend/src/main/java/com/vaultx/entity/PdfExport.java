package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pdf_exports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfExport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "export_name", nullable = false)
    private String exportName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(nullable = false)
    private String status; // PENDING, PROCESSING, SUCCESS, FAILED

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "export_type")
    private String exportType; // MERGE, COMPRESS, SPLIT

    private String format; // PDF, ZIP

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
