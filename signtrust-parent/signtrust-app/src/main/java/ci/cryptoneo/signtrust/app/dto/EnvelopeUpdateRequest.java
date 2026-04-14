package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record EnvelopeUpdateRequest(
        String name,
        String message,
        String signingOrder,
        LocalDateTime expiresAt
) {}
