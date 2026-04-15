package ci.cryptoneo.signtrust.app.dto;

public record GlobalMetricsDto(
    long mrr,
    double mrrGrowthPct,
    int newTenants,
    double newTenantsGrowthPct,
    int signaturesPerDay,
    double signaturesGrowthPct,
    double churnRate,
    double churnDelta
) {}
