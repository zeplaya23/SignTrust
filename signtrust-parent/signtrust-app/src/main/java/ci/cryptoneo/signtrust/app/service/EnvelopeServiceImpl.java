package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.*;
import ci.cryptoneo.signtrust.audit.AuditLogEntity;
import ci.cryptoneo.signtrust.audit.AuditService;
import ci.cryptoneo.signtrust.envelope.EnvelopeService;
import ci.cryptoneo.signtrust.notification.NotificationService;
import ci.cryptoneo.signtrust.signature.SignatureService;
import ci.cryptoneo.signtrust.storage.StorageService;
import ci.cryptoneo.signtrust.tenant.TenantContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class EnvelopeServiceImpl implements EnvelopeService {

    private static final Logger LOG = Logger.getLogger(EnvelopeServiceImpl.class);

    @Inject
    EntityManager em;

    @Inject
    StorageService storageService;

    @Inject
    NotificationService notificationService;

    @Inject
    SignatureService signatureService;

    @Inject
    AuditService auditService;

    @ConfigProperty(name = "signtrust.frontend.url", defaultValue = "http://localhost:5080")
    String frontendUrl;

    @Override
    @Transactional
    public Long create(String tenantId, String name, String createdBy) {
        EnvelopeEntity envelope = new EnvelopeEntity();
        envelope.setTenantId(tenantId);
        envelope.setName(name);
        envelope.setStatus("DRAFT");
        envelope.setCreatedBy(createdBy);
        envelope.setSigningOrder("PARALLEL");
        em.persist(envelope);
        auditService.log(tenantId, "ENVELOPE_CREATED", createdBy, "ENVELOPE", envelope.getId().toString(), "Envelope created: " + name);
        return envelope.getId();
    }

    @Transactional
    public EnvelopeEntity createFull(String tenantId, String createdBy, EnvelopeCreateRequest req) {
        EnvelopeEntity envelope = new EnvelopeEntity();
        envelope.setTenantId(tenantId);
        envelope.setName(req.name());
        envelope.setStatus("DRAFT");
        envelope.setCreatedBy(createdBy);
        envelope.setMessage(req.message());
        envelope.setSigningOrder(req.signingOrder() != null ? req.signingOrder() : "PARALLEL");
        envelope.setExpiresAt(req.expiresAt());
        em.persist(envelope);
        auditService.log(tenantId, "ENVELOPE_CREATED", createdBy, "ENVELOPE", envelope.getId().toString(), "Envelope created: " + req.name());
        return envelope;
    }

    @Transactional
    public EnvelopeEntity update(Long envelopeId, String tenantId, EnvelopeUpdateRequest req) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        if (!"DRAFT".equals(envelope.getStatus())) {
            throw new WebApplicationException("Only DRAFT envelopes can be updated", Response.Status.BAD_REQUEST);
        }
        if (req.name() != null) envelope.setName(req.name());
        if (req.message() != null) envelope.setMessage(req.message());
        if (req.signingOrder() != null) envelope.setSigningOrder(req.signingOrder());
        if (req.expiresAt() != null) envelope.setExpiresAt(req.expiresAt());
        em.merge(envelope);
        return envelope;
    }

    @Transactional
    public void delete(Long envelopeId, String tenantId) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        if (!"DRAFT".equals(envelope.getStatus())) {
            throw new WebApplicationException("Only DRAFT envelopes can be deleted", Response.Status.BAD_REQUEST);
        }
        // Delete associated documents from storage
        for (DocumentEntity doc : envelope.getDocuments()) {
            try {
                storageService.delete(tenantId, doc.getStorageKey());
            } catch (Exception e) {
                LOG.warnf("Failed to delete storage key %s: %s", doc.getStorageKey(), e.getMessage());
            }
        }
        em.remove(envelope);
        auditService.log(tenantId, "ENVELOPE_DELETED", envelope.getCreatedBy(), "ENVELOPE", envelopeId.toString(), "Envelope deleted");
    }

    public EnvelopeEntity findEnvelope(Long envelopeId, String tenantId) {
        EnvelopeEntity envelope = em.find(EnvelopeEntity.class, envelopeId);
        if (envelope == null || !envelope.getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Envelope not found", Response.Status.NOT_FOUND);
        }
        return envelope;
    }

    public List<SignatoryEntity> getSignatories(Long envelopeId, String tenantId) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        return envelope.getSignatories();
    }

    @SuppressWarnings("unchecked")
    public List<EnvelopeEntity> list(String tenantId, String userId, String status, int page, int size) {
        String query = "SELECT e FROM EnvelopeEntity e WHERE e.tenantId = :tenantId AND e.createdBy = :userId";
        if (status != null && !status.isBlank()) {
            query += " AND e.status = :status";
        }
        query += " ORDER BY e.createdAt DESC";

        var q = em.createQuery(query, EnvelopeEntity.class)
                .setParameter("tenantId", tenantId)
                .setParameter("userId", userId);
        if (status != null && !status.isBlank()) {
            q.setParameter("status", status);
        }
        return q.setFirstResult(page * size).setMaxResults(size).getResultList();
    }

    public long count(String tenantId, String userId, String status) {
        String query = "SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tenantId AND e.createdBy = :userId";
        if (status != null && !status.isBlank()) {
            query += " AND e.status = :status";
        }
        var q = em.createQuery(query, Long.class)
                .setParameter("tenantId", tenantId)
                .setParameter("userId", userId);
        if (status != null && !status.isBlank()) {
            q.setParameter("status", status);
        }
        return q.getSingleResult();
    }

    @Override
    @Transactional
    public void addDocument(Long envelopeId, String fileName, byte[] content) {
        String tenantId = TenantContext.get();
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);

        String storageKey = "envelopes/" + envelopeId + "/documents/" + UUID.randomUUID() + "/" + fileName;
        storageService.upload(tenantId, storageKey, content, "application/pdf");

        DocumentEntity doc = new DocumentEntity();
        doc.setEnvelope(envelope);
        doc.setName(fileName);
        doc.setContentType("application/pdf");
        doc.setStorageKey(storageKey);
        doc.setOrderIndex(envelope.getDocuments().size());
        em.persist(doc);
    }

    @Transactional
    public DocumentEntity addDocumentFull(Long envelopeId, String tenantId, String fileName, byte[] content, String contentType) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        if (!"DRAFT".equals(envelope.getStatus())) {
            throw new WebApplicationException("Documents can only be added to DRAFT envelopes", Response.Status.BAD_REQUEST);
        }

        String storageKey = "envelopes/" + envelopeId + "/documents/" + UUID.randomUUID() + "/" + fileName;
        storageService.upload(tenantId, storageKey, content, contentType != null ? contentType : "application/pdf");

        DocumentEntity doc = new DocumentEntity();
        doc.setEnvelope(envelope);
        doc.setName(fileName);
        doc.setContentType(contentType != null ? contentType : "application/pdf");
        doc.setStorageKey(storageKey);
        doc.setOrderIndex(envelope.getDocuments().size());
        em.persist(doc);

        auditService.log(tenantId, "DOCUMENT_ADDED", envelope.getCreatedBy(), "DOCUMENT", doc.getId() != null ? doc.getId().toString() : "new", "Document added: " + fileName);
        return doc;
    }

    public DocumentEntity findDocument(Long documentId, Long envelopeId, String tenantId) {
        DocumentEntity doc = em.find(DocumentEntity.class, documentId);
        if (doc == null || !doc.getEnvelope().getId().equals(envelopeId) || !doc.getEnvelope().getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Document not found", Response.Status.NOT_FOUND);
        }
        return doc;
    }

    @Transactional
    public void deleteDocument(Long documentId, Long envelopeId, String tenantId) {
        DocumentEntity doc = findDocument(documentId, envelopeId, tenantId);
        if (!"DRAFT".equals(doc.getEnvelope().getStatus())) {
            throw new WebApplicationException("Documents can only be removed from DRAFT envelopes", Response.Status.BAD_REQUEST);
        }
        try {
            storageService.delete(tenantId, doc.getStorageKey());
        } catch (Exception e) {
            LOG.warnf("Failed to delete storage key: %s", e.getMessage());
        }
        em.remove(doc);
    }

    @Override
    @Transactional
    public void addSignatory(Long envelopeId, String email, String name, String role) {
        String tenantId = TenantContext.get();
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);

        SignatoryEntity sig = new SignatoryEntity();
        sig.setEnvelope(envelope);
        sig.setEmail(email);
        sig.setFirstName(name);
        sig.setRole(role != null ? role : "SIGNER");
        sig.setStatus("PENDING");
        sig.setOrderIndex(envelope.getSignatories().size());
        em.persist(sig);
    }

    @Transactional
    public SignatoryEntity addSignatoryFull(Long envelopeId, String tenantId, SignatoryCreateRequest req) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        if (!"DRAFT".equals(envelope.getStatus())) {
            throw new WebApplicationException("Signatories can only be added to DRAFT envelopes", Response.Status.BAD_REQUEST);
        }

        SignatoryEntity sig = new SignatoryEntity();
        sig.setEnvelope(envelope);
        sig.setEmail(req.email());
        sig.setFirstName(req.firstName());
        sig.setLastName(req.lastName());
        sig.setRole(req.role() != null ? req.role() : "SIGNER");
        sig.setStatus("PENDING");
        sig.setOrderIndex(req.orderIndex() != null ? req.orderIndex() : envelope.getSignatories().size());
        em.persist(sig);
        return sig;
    }

    @Transactional
    public SignatoryEntity updateSignatory(Long signatoryId, Long envelopeId, String tenantId, SignatoryCreateRequest req) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        SignatoryEntity sig = em.find(SignatoryEntity.class, signatoryId);
        if (sig == null || !sig.getEnvelope().getId().equals(envelopeId)) {
            throw new WebApplicationException("Signatory not found", Response.Status.NOT_FOUND);
        }
        if (req.email() != null) sig.setEmail(req.email());
        if (req.firstName() != null) sig.setFirstName(req.firstName());
        if (req.lastName() != null) sig.setLastName(req.lastName());
        if (req.role() != null) sig.setRole(req.role());
        if (req.orderIndex() != null) sig.setOrderIndex(req.orderIndex());
        em.merge(sig);
        return sig;
    }

    @Transactional
    public void deleteSignatory(Long signatoryId, Long envelopeId, String tenantId) {
        findEnvelope(envelopeId, tenantId);
        SignatoryEntity sig = em.find(SignatoryEntity.class, signatoryId);
        if (sig == null || !sig.getEnvelope().getId().equals(envelopeId)) {
            throw new WebApplicationException("Signatory not found", Response.Status.NOT_FOUND);
        }
        em.remove(sig);
    }

    @Transactional
    public SignatureFieldEntity addField(Long envelopeId, String tenantId, SignatureFieldCreateRequest req) {
        findEnvelope(envelopeId, tenantId);

        DocumentEntity doc = em.find(DocumentEntity.class, req.documentId());
        if (doc == null || !doc.getEnvelope().getId().equals(envelopeId)) {
            throw new WebApplicationException("Document not found in this envelope", Response.Status.BAD_REQUEST);
        }

        SignatureFieldEntity field = new SignatureFieldEntity();
        field.setDocument(doc);
        if (req.signatoryId() != null) {
            SignatoryEntity sig = em.find(SignatoryEntity.class, req.signatoryId());
            if (sig != null) field.setSignatory(sig);
        }
        field.setType(req.type() != null ? req.type() : "SIGNATURE");
        field.setPageNumber(req.pageNumber());
        field.setX(req.x());
        field.setY(req.y());
        field.setWidth(req.width());
        field.setHeight(req.height());
        em.persist(field);
        return field;
    }

    @Transactional
    public SignatureFieldEntity updateField(Long fieldId, Long envelopeId, String tenantId, SignatureFieldCreateRequest req) {
        findEnvelope(envelopeId, tenantId);
        SignatureFieldEntity field = em.find(SignatureFieldEntity.class, fieldId);
        if (field == null) {
            throw new WebApplicationException("Field not found", Response.Status.NOT_FOUND);
        }
        if (req.pageNumber() != null) field.setPageNumber(req.pageNumber());
        if (req.x() != null) field.setX(req.x());
        if (req.y() != null) field.setY(req.y());
        if (req.width() != null) field.setWidth(req.width());
        if (req.height() != null) field.setHeight(req.height());
        if (req.type() != null) field.setType(req.type());
        if (req.signatoryId() != null) {
            SignatoryEntity sig = em.find(SignatoryEntity.class, req.signatoryId());
            if (sig != null) field.setSignatory(sig);
        }
        em.merge(field);
        return field;
    }

    @Transactional
    public void deleteField(Long fieldId, Long envelopeId, String tenantId) {
        findEnvelope(envelopeId, tenantId);
        SignatureFieldEntity field = em.find(SignatureFieldEntity.class, fieldId);
        if (field == null) {
            throw new WebApplicationException("Field not found", Response.Status.NOT_FOUND);
        }
        em.remove(field);
    }

    public List<SignatureFieldEntity> listFields(Long envelopeId, String tenantId) {
        findEnvelope(envelopeId, tenantId);
        return em.createQuery(
                        "SELECT f FROM SignatureFieldEntity f WHERE f.document.envelope.id = :envelopeId", SignatureFieldEntity.class)
                .setParameter("envelopeId", envelopeId)
                .getResultList();
    }

    @Override
    @Transactional
    public void send(Long envelopeId) {
        String tenantId = TenantContext.get();
        sendEnvelope(envelopeId, tenantId);
    }

    @Transactional
    public void sendEnvelope(Long envelopeId, String tenantId) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        if (!"DRAFT".equals(envelope.getStatus())) {
            throw new WebApplicationException("Only DRAFT envelopes can be sent", Response.Status.BAD_REQUEST);
        }
        if (envelope.getDocuments().isEmpty()) {
            throw new WebApplicationException("Envelope must have at least one document", Response.Status.BAD_REQUEST);
        }
        if (envelope.getSignatories().isEmpty()) {
            throw new WebApplicationException("Envelope must have at least one signatory", Response.Status.BAD_REQUEST);
        }

        envelope.setStatus("SENT");
        em.merge(envelope);

        // Generate tokens and send email invitations
        for (SignatoryEntity sig : envelope.getSignatories()) {
            if ("CC".equals(sig.getRole())) continue;
            sig.generateToken();
            em.merge(sig);

            try {
                String signingLink = frontendUrl + "/sign/" + sig.getToken();
                String html = buildSigningEmailHtml(envelope.getName(), sig.getFirstName(), envelope.getMessage(), signingLink);
                notificationService.sendEmail(sig.getEmail(), "Invitation a signer: " + envelope.getName(), html);
            } catch (Exception e) {
                LOG.warnf("Failed to send signing invitation to %s: %s", sig.getEmail(), e.getMessage());
            }
        }

        // Notify CC signatories
        for (SignatoryEntity sig : envelope.getSignatories()) {
            if ("CC".equals(sig.getRole())) {
                try {
                    String html = "<p>Bonjour " + sig.getFirstName() + ",</p>"
                            + "<p>Vous etes en copie de l'enveloppe: <strong>" + envelope.getName() + "</strong></p>"
                            + "<p>" + (envelope.getMessage() != null ? envelope.getMessage() : "") + "</p>";
                    notificationService.sendEmail(sig.getEmail(), "Copie: " + envelope.getName(), html);
                } catch (Exception e) {
                    LOG.warnf("Failed to send CC notification to %s: %s", sig.getEmail(), e.getMessage());
                }
            }
        }

        auditService.log(tenantId, "ENVELOPE_SENT", envelope.getCreatedBy(), "ENVELOPE", envelopeId.toString(),
                "Envelope sent to " + envelope.getSignatories().size() + " signatories");
    }

    @Override
    @Transactional
    public void cancel(Long envelopeId) {
        String tenantId = TenantContext.get();
        cancelEnvelope(envelopeId, tenantId);
    }

    @Transactional
    public void cancelEnvelope(Long envelopeId, String tenantId) {
        EnvelopeEntity envelope = findEnvelope(envelopeId, tenantId);
        if ("COMPLETED".equals(envelope.getStatus()) || "CANCELLED".equals(envelope.getStatus())) {
            throw new WebApplicationException("Cannot cancel a " + envelope.getStatus() + " envelope", Response.Status.BAD_REQUEST);
        }
        envelope.setStatus("CANCELLED");
        em.merge(envelope);
        auditService.log(tenantId, "ENVELOPE_CANCELLED", envelope.getCreatedBy(), "ENVELOPE", envelopeId.toString(), "Envelope cancelled");
    }

    // --- Signing operations ---

    public SignatoryEntity findSignatoryByToken(String token) {
        try {
            return em.createQuery("SELECT s FROM SignatoryEntity s WHERE s.token = :token", SignatoryEntity.class)
                    .setParameter("token", token)
                    .getSingleResult();
        } catch (Exception e) {
            throw new WebApplicationException("Invalid signing token", Response.Status.NOT_FOUND);
        }
    }

    @Transactional
    public void signByToken(String token, String signatureImageBase64) {
        SignatoryEntity sig = findSignatoryByToken(token);
        EnvelopeEntity envelope = sig.getEnvelope();

        if (!"SENT".equals(envelope.getStatus())) {
            throw new WebApplicationException("Envelope is not available for signing", Response.Status.BAD_REQUEST);
        }
        if (!"PENDING".equals(sig.getStatus())) {
            throw new WebApplicationException("Already " + sig.getStatus().toLowerCase(), Response.Status.BAD_REQUEST);
        }

        // Decode signature image from base64 (strip data URI prefix if present)
        byte[] signatureImageBytes = null;
        if (signatureImageBase64 != null && !signatureImageBase64.isBlank()) {
            String base64Data = signatureImageBase64;
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            signatureImageBytes = java.util.Base64.getDecoder().decode(base64Data);
        }

        String signerFullName = sig.getFirstName() + " " + sig.getLastName();

        // Sign each document and stamp signature at field positions
        for (DocumentEntity doc : envelope.getDocuments()) {
            byte[] content = storageService.download(envelope.getTenantId(), doc.getStorageKey());
            if (content == null) continue;

            // Stamp visual signature at each SIGNATURE field for this signatory on this document
            if (signatureImageBytes != null && doc.getFields() != null) {
                for (SignatureFieldEntity field : doc.getFields()) {
                    if (field.getSignatory() != null && field.getSignatory().getId().equals(sig.getId())
                            && "SIGNATURE".equals(field.getType())) {
                        content = signatureService.stampSignatureImage(content, signatureImageBytes,
                                field.getPageNumber() != null ? field.getPageNumber() : 1,
                                field.getX() != null ? field.getX() : 0,
                                field.getY() != null ? field.getY() : 0,
                                field.getWidth() != null ? field.getWidth() : 25,
                                field.getHeight() != null ? field.getHeight() : 8,
                                signerFullName);
                    }
                }
            }

            // Apply mock digital signature
            byte[] signed = signatureService.signPdf(content, sig.getEmail(),
                    "Signed by " + signerFullName, "SignTrust");
            storageService.upload(envelope.getTenantId(), doc.getStorageKey(), signed, doc.getContentType());
        }

        sig.setStatus("SIGNED");
        sig.setSignedAt(LocalDateTime.now());
        em.merge(sig);

        auditService.log(envelope.getTenantId(), "DOCUMENT_SIGNED", sig.getEmail(), "SIGNATORY", sig.getId().toString(),
                "Signed by " + sig.getEmail());

        // Check if all signatories have signed
        checkEnvelopeCompletion(envelope);
    }

    @Transactional
    public void rejectByToken(String token, String reason) {
        SignatoryEntity sig = findSignatoryByToken(token);
        EnvelopeEntity envelope = sig.getEnvelope();

        if (!"SENT".equals(envelope.getStatus())) {
            throw new WebApplicationException("Envelope is not available for signing", Response.Status.BAD_REQUEST);
        }
        if (!"PENDING".equals(sig.getStatus())) {
            throw new WebApplicationException("Already " + sig.getStatus().toLowerCase(), Response.Status.BAD_REQUEST);
        }

        sig.setStatus("REJECTED");
        sig.setSignedAt(LocalDateTime.now());
        em.merge(sig);

        auditService.log(envelope.getTenantId(), "DOCUMENT_REJECTED", sig.getEmail(), "SIGNATORY", sig.getId().toString(),
                "Rejected by " + sig.getEmail() + (reason != null ? ": " + reason : ""));
    }

    private void checkEnvelopeCompletion(EnvelopeEntity envelope) {
        boolean allSigned = envelope.getSignatories().stream()
                .filter(s -> !"CC".equals(s.getRole()))
                .allMatch(s -> "SIGNED".equals(s.getStatus()));
        if (allSigned) {
            envelope.setStatus("COMPLETED");
            em.merge(envelope);
            auditService.log(envelope.getTenantId(), "ENVELOPE_COMPLETED", envelope.getCreatedBy(), "ENVELOPE",
                    envelope.getId().toString(), "All signatories have signed");
        }
    }

    // --- Dashboard ---

    public DashboardStatsDto getStats(String tenantId, String userId) {
        long total = em.createQuery("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdBy = :uid", Long.class)
                .setParameter("tid", tenantId).setParameter("uid", userId).getSingleResult();
        long pending = em.createQuery("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdBy = :uid AND e.status = 'SENT'", Long.class)
                .setParameter("tid", tenantId).setParameter("uid", userId).getSingleResult();
        long signed = em.createQuery("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdBy = :uid AND e.status = 'COMPLETED'", Long.class)
                .setParameter("tid", tenantId).setParameter("uid", userId).getSingleResult();
        double rate = total > 0 ? (double) signed / total * 100 : 0;
        return new DashboardStatsDto(total, pending, signed, Math.round(rate * 100.0) / 100.0);
    }

    public List<EnvelopeEntity> getRecent(String tenantId, String userId) {
        return em.createQuery("SELECT e FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdBy = :uid ORDER BY e.createdAt DESC", EnvelopeEntity.class)
                .setParameter("tid", tenantId).setParameter("uid", userId)
                .setMaxResults(5)
                .getResultList();
    }

    public List<AuditLogEntity> getAuditTrail(String tenantId, Long envelopeId) {
        return em.createQuery(
                "SELECT a FROM AuditLogEntity a WHERE a.tenantId = :tid AND a.entityType = 'ENVELOPE' AND a.entityId = :eid ORDER BY a.createdAt ASC",
                AuditLogEntity.class)
                .setParameter("tid", tenantId)
                .setParameter("eid", String.valueOf(envelopeId))
                .getResultList();
    }

    private String buildSigningEmailHtml(String envelopeName, String signerName, String message, String signingLink) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>"
                + "<h2 style='color: #2563eb;'>SignTrust</h2>"
                + "<p>Bonjour " + (signerName != null ? signerName : "") + ",</p>"
                + "<p>Vous avez ete invite a signer le document: <strong>" + envelopeName + "</strong></p>"
                + (message != null ? "<p><em>" + message + "</em></p>" : "")
                + "<p><a href='" + signingLink + "' style='display: inline-block; padding: 12px 24px; "
                + "background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;'>"
                + "Signer maintenant</a></p>"
                + "<p style='color: #6b7280; font-size: 12px;'>Si vous ne pouvez pas cliquer sur le bouton, "
                + "copiez ce lien: " + signingLink + "</p>"
                + "</div>";
    }
}
