package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;
import java.util.List;

public record EnvelopeDto(
        Long id,
        String name,
        String status,
        String createdBy,
        String message,
        String signingOrder,
        LocalDateTime expiresAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<DocumentDto> documents,
        List<SignatoryDto> signatories,
        List<SignatureFieldDto> fields
) {}
