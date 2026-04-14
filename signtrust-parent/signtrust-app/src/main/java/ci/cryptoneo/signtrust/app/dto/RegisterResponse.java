package ci.cryptoneo.signtrust.app.dto;

public record RegisterResponse(
    Long userId,
    String email,
    String message
) {}
