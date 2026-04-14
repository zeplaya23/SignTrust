package ci.cryptoneo.signtrust.app.dto;

public record PaymentInitResponse(
    String reference,
    String status,
    String message
) {}
