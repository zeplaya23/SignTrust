package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.*;
import ci.cryptoneo.signtrust.audit.AuditLogEntity;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility class to map entities to DTOs.
 */
public final class DtoMapper {

    private DtoMapper() {}

    public static EnvelopeDto toEnvelopeDto(EnvelopeEntity e, List<AuditLogEntity> auditLogs) {
        List<DocumentDto> docs = e.getDocuments() != null
                ? e.getDocuments().stream().map(DtoMapper::toDocumentDto).collect(Collectors.toList())
                : Collections.emptyList();

        List<SignatoryDto> sigs = e.getSignatories() != null
                ? e.getSignatories().stream().map(DtoMapper::toSignatoryDto).collect(Collectors.toList())
                : Collections.emptyList();

        List<SignatureFieldDto> fields = e.getDocuments() != null
                ? e.getDocuments().stream()
                .flatMap(d -> d.getFields() != null ? d.getFields().stream() : java.util.stream.Stream.empty())
                .map(DtoMapper::toFieldDto)
                .collect(Collectors.toList())
                : Collections.emptyList();

        int docsCount = e.getDocuments() != null ? e.getDocuments().size() : 0;
        int sigsCount = e.getSignatories() != null ? e.getSignatories().size() : 0;

        List<AuditLogDto> trail = auditLogs != null
                ? auditLogs.stream().map(DtoMapper::toAuditLogDto).collect(Collectors.toList())
                : Collections.emptyList();

        return new EnvelopeDto(
                e.getId(), e.getName(), e.getStatus(), e.getCreatedBy(),
                e.getMessage(), e.getSigningOrder(), e.getExpiresAt(),
                e.getCreatedAt(), e.getUpdatedAt(),
                docsCount, sigsCount,
                docs, sigs, fields, trail
        );
    }

    public static EnvelopeDto toEnvelopeDtoLight(EnvelopeEntity e) {
        int docsCount = e.getDocuments() != null ? e.getDocuments().size() : 0;
        int sigsCount = e.getSignatories() != null ? e.getSignatories().size() : 0;

        return new EnvelopeDto(
                e.getId(), e.getName(), e.getStatus(), e.getCreatedBy(),
                e.getMessage(), e.getSigningOrder(), e.getExpiresAt(),
                e.getCreatedAt(), e.getUpdatedAt(),
                docsCount, sigsCount,
                null, null, null, null
        );
    }

    public static AuditLogDto toAuditLogDto(AuditLogEntity a) {
        return new AuditLogDto(
                a.getId(), a.getAction(), a.getUserId(),
                a.getEntityType(), a.getEntityId(), a.getDetails(),
                a.getCreatedAt() != null
                        ? a.getCreatedAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : null
        );
    }

    public static DocumentDto toDocumentDto(DocumentEntity d) {
        return new DocumentDto(d.getId(), d.getName(), d.getContentType(),
                d.getStorageKey(), d.getPageCount(), d.getOrderIndex(), d.getCreatedAt());
    }

    public static SignatoryDto toSignatoryDto(SignatoryEntity s) {
        return new SignatoryDto(s.getId(), s.getEmail(), s.getFirstName(),
                s.getLastName(), s.getRole(), s.getOrderIndex(), s.getStatus(), s.getSignedAt());
    }

    public static SignatureFieldDto toFieldDto(SignatureFieldEntity f) {
        return new SignatureFieldDto(f.getId(),
                f.getDocument() != null ? f.getDocument().getId() : null,
                f.getSignatory() != null ? f.getSignatory().getId() : null,
                f.getType(), f.getPageNumber(), f.getX(), f.getY(), f.getWidth(), f.getHeight());
    }

    public static TemplateDto toTemplateDto(TemplateEntity t) {
        return new TemplateDto(t.getId(), t.getName(), t.getDescription(),
                t.getDocumentsJson(), t.getSignatoryRolesJson(), t.getFieldsJson(),
                t.getUsageCount(), t.getCreatedAt());
    }

    public static ContactDto toContactDto(ContactEntity c) {
        return new ContactDto(c.getId(), c.getName(), c.getEmail(),
                c.getPhone(), c.getEnvelopeCount(), c.getCreatedAt());
    }

    public static NotificationDto toNotificationDto(NotificationEntity n) {
        return new NotificationDto(n.getId(), n.getType(), n.getTitle(),
                n.getMessage(), n.getRelatedEntityType(), n.getRelatedEntityId(),
                n.isRead(), n.getCreatedAt());
    }
}
