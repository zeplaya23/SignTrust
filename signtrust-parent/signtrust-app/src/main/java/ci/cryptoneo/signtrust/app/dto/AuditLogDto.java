package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record AuditLogDto(
        Long id,
        String action,
        String userId,
        String details,
        LocalDateTime createdAt
) {}
