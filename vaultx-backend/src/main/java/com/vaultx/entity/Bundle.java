package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "bundles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bundle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String color;

    @Column(length = 50)
    private String icon;

    @Column(name = "is_favourite")
    @Builder.Default
    private boolean favourite = false;

    @Column(name = "is_archived")
    @Builder.Default
    private boolean archived = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToOne(mappedBy = "bundle", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private BundleSettings settings;

    @OneToMany(mappedBy = "bundle", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<BundleDocument> documents = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
    
    public void addDocument(BundleDocument bd) {
        documents.add(bd);
        bd.setBundle(this);
    }
    
    public void removeDocument(BundleDocument bd) {
        documents.remove(bd);
        bd.setBundle(null);
    }
    
    public void setSettings(BundleSettings settings) {
        if (settings == null) {
            if (this.settings != null) {
                this.settings.setBundle(null);
            }
        } else {
            settings.setBundle(this);
        }
        this.settings = settings;
    }
}
