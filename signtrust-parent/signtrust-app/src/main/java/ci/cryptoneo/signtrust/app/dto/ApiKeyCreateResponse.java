package ci.cryptoneo.signtrust.app.dto;

public record ApiKeyCreateResponse(
    Long id,
    String keyPrefix,
    String label,
    String fullKey // Returned ONCE at creation, never again
) {}
