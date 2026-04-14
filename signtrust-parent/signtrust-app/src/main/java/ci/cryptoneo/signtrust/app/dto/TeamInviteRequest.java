package ci.cryptoneo.signtrust.app.dto;

public record TeamInviteRequest(
        String email,
        String firstName,
        String lastName,
        String role
) {}
