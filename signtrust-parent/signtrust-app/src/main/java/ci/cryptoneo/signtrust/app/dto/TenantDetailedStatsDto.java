package ci.cryptoneo.signtrust.app.dto;

public record TenantDetailedStatsDto(
    long signaturesMonth,
    double signaturesGrowthPct,
    double completionRate,
    double rejectionRate,
    long documentsCount,
    long mrrAmount,
    String lastActivity
) {}
