package ci.cryptoneo.signtrust.payment;

public record PaymentStatus(
    String reference,
    String status,
    long amount,
    String currency,
    String channel,
    String paidAt
) {}
