package ci.cryptoneo.signtrust.app.service;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility class to map entities to DTOs.
 */
public final class DtoMapper {

    private DtoMapper() {}

    public static EnvelopeDto toEnvelopeDto(EnvelopeEntity e) {
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

        return new EnvelopeDto(
                e.getId(), e.getName(), e.getStatus(), e.getCreatedBy(),
                e.getMessage(), e.getSigningOrder(), e.getExpiresAt(),
                e.getCreatedAt(), e.getUpdatedAt(),
                docs, sigs, fields
        );
    }

    public static EnvelopeDto toEnvelopeDtoLight(EnvelopeEntity e) {
        return new EnvelopeDto(
                e.getId(), e.getName(), e.getStatus(), e.getCreatedBy(),
                e.getMessage(), e.getSigningOrder(), e.getExpiresAt(),
                e.getCreatedAt(), e.getUpdatedAt(),
                null, null, null
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
