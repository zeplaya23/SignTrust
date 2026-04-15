package ci.cryptoneo.signtrust.app.dto;

import java.time.LocalDateTime;

public record AdminTenantDto(
    String id,
    String name,
    String plan,
    String status,
    int envelopesUsed,
    int envelopesMax,
    int usersCount,
    int usersMax,
    long revenue,
    LocalDateTime registeredAt,
    String email,
    String phone,
    String type,
    String realmKeycloak,
    String bucketMinio,
    String subCaEjbca,
    String nextPayment,
    String paymentMethod
) {}
