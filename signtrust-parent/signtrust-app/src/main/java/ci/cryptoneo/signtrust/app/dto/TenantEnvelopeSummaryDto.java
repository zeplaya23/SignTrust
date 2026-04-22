package ci.cryptoneo.signtrust.app.dto;

public record TenantEnvelopeSummaryDto(
    Long id,
    String name,
    String status,
    String createdBy,
    String createdAt,
    int signatoriesTotal,
    int signatoriesSigned,
    int signatoriesRejected
) {}
