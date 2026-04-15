package ci.cryptoneo.signtrust.app.dto;

public record CertificateDto(
    String id,
    String subject,
    String type,
    String issuerCa,
    String issuedAt,
    String expiresAt,
    String status
) {}
