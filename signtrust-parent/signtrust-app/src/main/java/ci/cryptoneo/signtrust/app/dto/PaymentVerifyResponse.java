package ci.cryptoneo.signtrust.app.dto;

public record PaymentVerifyResponse(
    String reference,
    String status,
    long amount,
    String currency,
    String channel,
    String paidAt,
    String subscriptionStatus
) {}
