package ci.cryptoneo.signtrust.app.dto;

public record ActivityCountersDto(
    long envelopesCreated,
    long signatures,
    long documentsUploaded,
    long emailsSent,
    long paystackPayments,
    long apiErrors
) {}
