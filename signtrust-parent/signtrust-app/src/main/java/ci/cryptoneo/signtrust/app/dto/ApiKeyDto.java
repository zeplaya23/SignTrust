package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record ApiKeyDto(
    Long id,
    String keyPrefix,
    String label,
    long usageCount,
    boolean active,
    boolean enabled,
    LocalDateTime createdAt,
    LocalDateTime revokedAt
) {}
