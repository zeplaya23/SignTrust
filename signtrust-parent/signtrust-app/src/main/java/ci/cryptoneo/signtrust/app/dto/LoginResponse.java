package ci.cryptoneo.signtrust.app.dto;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,
    UserInfo user
) {
    public record UserInfo(
        String id,
        String email,
        String firstName,
        String lastName,
        String phone,
        String role,
        String tenantId,
        String subscriptionStatus,
        String accountType,
        String companyName
    ) {}
}
