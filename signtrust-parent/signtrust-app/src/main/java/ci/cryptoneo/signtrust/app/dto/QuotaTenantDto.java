package ci.cryptoneo.signtrust.app.dto;

public record QuotaTenantDto(String id, String name, String plan, int used, int max, int percent) {}
