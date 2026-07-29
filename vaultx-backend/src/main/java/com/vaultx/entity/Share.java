package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

@Entity
@Table(name = "shares")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Share {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(name = "target_type", nullable = false)
    private String targetType; // DOCUMENT, COLLECTION, BUNDLE, PDF_EXPORT

    @Column(name = "hashed_password")
    private String hashedPassword;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "max_downloads")
    private Integer maxDownloads;

    @Column(name = "downloads_count")
    private Integer downloadsCount = 0;

    @Column(name = "views_count")
    private Integer viewsCount = 0;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "allow_download")
    private boolean allowDownload = true;

    @Column(name = "allow_print")
    private boolean allowPrint = false;

    @Column(name = "allow_copy")
    private boolean allowCopy = false;

    @Column(name = "allow_pdf_export")
    private boolean allowPdfExport = false;

    @OneToMany(mappedBy = "share", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ShareFile> shareFiles = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addShareFile(ShareFile file) {
        shareFiles.add(file);
        file.setShare(this);
    }
}
