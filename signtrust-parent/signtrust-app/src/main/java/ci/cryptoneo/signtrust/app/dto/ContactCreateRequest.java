package ci.cryptoneo.signtrust.app.dto;

public record ContactCreateRequest(
        String name,
        String email,
        String phone
) {}
