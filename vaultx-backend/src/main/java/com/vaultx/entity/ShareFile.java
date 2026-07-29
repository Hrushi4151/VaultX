package com.vaultx.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "share_files", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"share_id", "document_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "share_id", nullable = false)
    private Share share;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;
}
