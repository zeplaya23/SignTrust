package ci.cryptoneo.signtrust.app.dto;

public record InfraMetricsDto(
    double cpuPercent,
    double ramUsedGb,
    double ramTotalGb,
    double storageUsedGb,
    double storageTotalGb,
    long requestsPerMin,
    long p95LatencyMs
) {}
