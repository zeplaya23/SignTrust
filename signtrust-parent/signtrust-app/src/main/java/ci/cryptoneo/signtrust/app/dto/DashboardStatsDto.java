package ci.cryptoneo.signtrust.app.dto;

public record DashboardStatsDto(
        long totalEnvelopes,
        long pending,
        long signed,
        double completionRate,
        QuotaInfoDto quota
) {
    // Backward-compatible constructor
    public DashboardStatsDto(long totalEnvelopes, long pending, long signed, double completionRate) {
        this(totalEnvelopes, pending, signed, completionRate, null);
    }
}
