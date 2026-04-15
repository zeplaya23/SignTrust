package ci.cryptoneo.signtrust.app.dto;

public record HsmSlotDto(int slot, String label, int keyCount, String keyType, String status) {}
