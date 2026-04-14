package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record DocumentDto(
        Long id,
        String name,
        String contentType,
        String storageKey,
        Integer pageCount,
        Integer orderIndex,
        LocalDateTime createdAt
) {}
