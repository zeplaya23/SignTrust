package ci.cryptoneo.signtrust.app.dto;

public record AuditLogDto(
        Long id,
        String action,
        String userId,
        String entityType,
        String entityId,
        String details,
        String createdAt
) {}
