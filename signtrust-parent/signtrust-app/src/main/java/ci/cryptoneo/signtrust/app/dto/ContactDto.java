package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record ContactDto(
        Long id,
        String name,
        String email,
        String phone,
        Integer envelopeCount,
        LocalDateTime createdAt
) {}
