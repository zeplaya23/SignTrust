package ci.cryptoneo.signtrust.app.dto;

public record AdminDashboardDto(
    long tenantsActive,
    int tenantsGrowth,
    long envelopesTotal,
    double envelopesGrowthPct,
    long signaturesMonth,
    double signaturesGrowthPct,
    long revenueMonthly,
    double revenueMrrPct,
    long certificatesActive
) {}
