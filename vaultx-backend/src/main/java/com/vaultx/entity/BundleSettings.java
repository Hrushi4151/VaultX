package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bundle_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BundleSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bundle_id", nullable = false, unique = true)
    private Bundle bundle;

    @Column(name = "include_cover_page")
    @Builder.Default
    private boolean includeCoverPage = true;

    @Column(name = "include_toc")
    @Builder.Default
    private boolean includeToc = true;

    @Column(name = "include_page_numbers")
    @Builder.Default
    private boolean includePageNumbers = true;

    @Column(name = "watermark_text")
    private String watermarkText;

    @Column(name = "compress_output")
    @Builder.Default
    private boolean compressOutput = false;

    @Column(name = "output_name")
    private String outputName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
