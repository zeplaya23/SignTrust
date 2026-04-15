package ci.cryptoneo.signtrust.app.dto;

public record CertificateIssueRequest(
    String tenantId,
    String userId,
    String profile,
    String algorithm,
    String duration
) {}
