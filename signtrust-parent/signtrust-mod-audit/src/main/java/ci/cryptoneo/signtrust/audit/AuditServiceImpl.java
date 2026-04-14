package ci.cryptoneo.signtrust.audit;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@ApplicationScoped
public class AuditServiceImpl implements AuditService {

    private static final Logger LOG = Logger.getLogger(AuditServiceImpl.class);

    @Inject
    EntityManager em;

    @Override
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void log(String tenantId, String action, String userId, String entityType, String entityId, String details) {
        try {
            // Get the last chain hash
            String previousHash = getLastChainHash(tenantId);

            AuditLogEntity entry = new AuditLogEntity();
            entry.setTenantId(tenantId);
            entry.setAction(action);
            entry.setUserId(userId);
            entry.setEntityType(entityType);
            entry.setEntityId(entityId);
            entry.setDetails(details);
            entry.setCreatedAt(LocalDateTime.now());

            // Compute chain hash: SHA-256(previousHash + data)
            String dataToHash = (previousHash != null ? previousHash : "") +
                    tenantId + action + userId + entityType + entityId + details + entry.getCreatedAt();
            entry.setChainHash(sha256(dataToHash));

            em.persist(entry);
            LOG.debugf("Audit: [%s] %s %s/%s by %s", tenantId, action, entityType, entityId, userId);
        } catch (Exception e) {
            LOG.errorf(e, "Failed to write audit log: %s %s/%s", action, entityType, entityId);
        }
    }

    private String getLastChainHash(String tenantId) {
        try {
            return em.createQuery(
                            "SELECT a.chainHash FROM AuditLogEntity a WHERE a.tenantId = :tenantId ORDER BY a.id DESC",
                            String.class)
                    .setParameter("tenantId", tenantId)
                    .setMaxResults(1)
                    .getSingleResult();
        } catch (Exception e) {
            return null;
        }
    }

    private String sha256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
