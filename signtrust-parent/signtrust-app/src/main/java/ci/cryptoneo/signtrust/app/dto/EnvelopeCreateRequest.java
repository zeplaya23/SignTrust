package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record EnvelopeCreateRequest(
        String name,
        String message,
        String signingOrder,
        LocalDateTime expiresAt
) {}
