package ci.cryptoneo.signtrust.audit;

public interface AuditService {
    void log(String tenantId, String action, String userId, String entityType, String entityId, String details);
}
