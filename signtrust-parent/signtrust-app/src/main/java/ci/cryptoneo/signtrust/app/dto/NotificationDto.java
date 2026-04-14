package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String type,
        String title,
        String message,
        String relatedEntityType,
        String relatedEntityId,
        boolean read,
        LocalDateTime createdAt
) {}
