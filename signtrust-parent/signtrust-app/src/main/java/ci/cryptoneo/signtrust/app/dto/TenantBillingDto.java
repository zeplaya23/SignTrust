package ci.cryptoneo.signtrust.app.dto;

public record TenantBillingDto(
    Long id,
    String planId,
    String status,
    String paymentMethod,
    String paymentReference,
    long amount,
    String startDate,
    String endDate,
    String createdAt
) {}
