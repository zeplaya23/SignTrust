package ci.cryptoneo.signtrust.app.dto;

public record SignatoryCreateRequest(
        String email,
        String firstName,
        String lastName,
        String role,
        Integer orderIndex
) {}
