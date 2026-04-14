package ci.cryptoneo.signtrust.app.dto;

public record PaymentInitRequest(
    Long userId,
    String planId,
    String paymentMethod,
    String mobileOperator,
    long amount
) {}
