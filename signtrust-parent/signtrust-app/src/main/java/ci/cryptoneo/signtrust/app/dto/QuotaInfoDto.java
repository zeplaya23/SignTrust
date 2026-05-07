package ci.cryptoneo.signtrust.app.dto;

public record QuotaInfoDto(
        String plan,
        String subscriptionStatus,
        int envelopesMax,
        long envelopesUsed,
        boolean canCreate,
        String message
) {}
