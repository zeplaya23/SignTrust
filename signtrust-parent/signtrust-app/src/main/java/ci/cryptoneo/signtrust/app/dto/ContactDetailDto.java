package ci.cryptoneo.signtrust.app.dto;

import java.util.List;

public record ContactDetailDto(
    long id,
    String name,
    String email,
    String phone,
    int envelopeCount,
    String createdAt,
    List<ContactEnvelopeDto> envelopes,
    List<AuditLogDto> auditTrail
) {
    public record ContactEnvelopeDto(
        long envelopeId,
        String envelopeName,
        String role,
        String status,
        String signedAt,
        String createdAt
    ) {}
}
