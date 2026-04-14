package ci.cryptoneo.signtrust.app.dto;

public record RegisterRequest(
    String accountType,
    String companyName,
    String firstName,
    String lastName,
    String email,
    String phone,
    String password,
    String planId
) {}
