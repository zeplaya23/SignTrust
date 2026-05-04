package ci.cryptoneo.signtrust.app.dto;

import java.util.List;

public record MemberDetailDto(
    String id,
    String name,
    String email,
    String phone,
    String role,
    String companyName,
    String accountType,
    String createdAt,
    String lastActivity,
    int envelopesCreated,
    int envelopesSigned,
    int envelopesRejected,
    List<MemberEnvelopeDto> envelopes,
    List<MemberParticipationDto> participations,
    List<AuditLogDto> auditTrail
) {
    public record MemberEnvelopeDto(
        long id,
        String name,
        String status,
        String createdAt,
        int signatoriesCount,
        int documentsCount
    ) {}

    public record MemberParticipationDto(
        long envelopeId,
        String envelopeName,
        String role,
        String status,
        String signedAt,
        String createdAt
    ) {}
}
