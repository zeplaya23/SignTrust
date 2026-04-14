package ci.cryptoneo.signtrust.app.dto;

public record DashboardStatsDto(
        long totalEnvelopes,
        long pending,
        long signed,
        double completionRate
) {}
