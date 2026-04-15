package ci.cryptoneo.signtrust.app.dto;

public record AdminTenantCreateRequest(
    String name,
    String email,
    String type,
    String plan
) {}
