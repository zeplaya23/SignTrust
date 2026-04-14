package ci.cryptoneo.signtrust.app.dto;

public record TeamMemberDto(
        String userId,
        String email,
        String firstName,
        String lastName,
        String role
) {}
