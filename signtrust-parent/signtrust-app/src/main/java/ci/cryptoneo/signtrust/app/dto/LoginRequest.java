package ci.cryptoneo.signtrust.app.dto;

public record LoginRequest(
    String email,
    String password
) {}
