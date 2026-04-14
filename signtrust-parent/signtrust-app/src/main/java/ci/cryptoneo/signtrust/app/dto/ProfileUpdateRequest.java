package ci.cryptoneo.signtrust.app.dto;

public record ProfileUpdateRequest(
        String firstName,
        String lastName,
        String phone,
        String companyName
) {}
