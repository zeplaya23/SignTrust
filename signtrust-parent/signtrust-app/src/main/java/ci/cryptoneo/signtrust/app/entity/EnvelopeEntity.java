package ci.cryptoneo.signtrust.app.entity;

import ci.cryptoneo.signtrust.tenant.TenantEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "envelopes")
public class EnvelopeEntity extends TenantEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String status; // DRAFT, SENT, COMPLETED, CANCELLED

    @Column(name = "created_by")
    private String createdBy;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "signing_order")
    private String signingOrder; // SEQUENTIAL, PARALLEL

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @OneToMany(mappedBy = "envelope", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DocumentEntity> documents = new ArrayList<>();

    @OneToMany(mappedBy = "envelope", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SignatoryEntity> signatories = new ArrayList<>();

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSigningOrder() { return signingOrder; }
    public void setSigningOrder(String signingOrder) { this.signingOrder = signingOrder; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public List<DocumentEntity> getDocuments() { return documents; }
    public void setDocuments(List<DocumentEntity> documents) { this.documents = documents; }

    public List<SignatoryEntity> getSignatories() { return signatories; }
    public void setSignatories(List<SignatoryEntity> signatories) { this.signatories = signatories; }
}
