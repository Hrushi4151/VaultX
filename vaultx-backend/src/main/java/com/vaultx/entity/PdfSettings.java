package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pdf_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PdfSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private User owner;

    @Column(name = "include_cover_page")
    private boolean includeCoverPage;

    @Column(name = "include_toc")
    private boolean includeToc;

    @Column(name = "page_numbers_position")
    private String pageNumbersPosition; // TOP_LEFT, TOP_CENTER, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_CENTER, BOTTOM_RIGHT

    @Column(name = "watermark_text")
    private String watermarkText;

    @Column(name = "watermark_opacity", columnDefinition = "decimal(3,2)")
    private java.math.BigDecimal watermarkOpacity;

    @Column(name = "watermark_rotation")
    private Integer watermarkRotation;

    @Column(name = "watermark_color")
    private String watermarkColor;

    @Column(name = "compression_level")
    private String compressionLevel; // LOW, MEDIUM, HIGH

    @Column(name = "owner_password")
    private String ownerPassword;

    @Column(name = "user_password")
    private String userPassword;

    @Column(name = "allow_print")
    private boolean allowPrint = true;

    @Column(name = "allow_copy")
    private boolean allowCopy = true;

    @Column(name = "allow_edit")
    private boolean allowEdit = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
