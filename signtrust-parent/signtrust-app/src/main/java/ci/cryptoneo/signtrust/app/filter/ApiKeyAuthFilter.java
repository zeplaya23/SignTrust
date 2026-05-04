package ci.cryptoneo.signtrust.app.filter;

import ci.cryptoneo.signtrust.app.entity.ApiKeyEntity;
import ci.cryptoneo.signtrust.tenant.TenantContext;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Authenticates requests using X-API-Key header.
 * Only activates if no Bearer token is present and X-API-Key header exists.
 * Sets TenantContext so all downstream services use the correct tenant.
 */
@Provider
@Priority(Priorities.AUTHENTICATION - 10)
public class ApiKeyAuthFilter implements ContainerRequestFilter {

    private static final Logger LOG = Logger.getLogger(ApiKeyAuthFilter.class);
    private static final String API_KEY_HEADER = "X-API-Key";

    @Inject
    EntityManager em;

    @Override
    public void filter(ContainerRequestContext ctx) {
        String path = ctx.getUriInfo().getPath();
        if (!path.startsWith("api/") && !path.startsWith("/api/")) return;

        // Skip if Bearer token is present (use normal OIDC auth)
        String authHeader = ctx.getHeaderString("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) return;

        // Check for API key
        String apiKey = ctx.getHeaderString(API_KEY_HEADER);
        if (apiKey == null || apiKey.isBlank()) return;

        // Skip auth endpoints
        if (path.contains("/auth/")) return;

        // Lookup key
        String keyHash = sha256(apiKey);
        try {
            ApiKeyEntity key = em.createQuery(
                    "SELECT k FROM ApiKeyEntity k WHERE k.keyHash = :hash",
                    ApiKeyEntity.class)
                    .setParameter("hash", keyHash)
                    .getSingleResult();

            if (key.getRevokedAt() != null) {
                ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                        .entity("{\"error\":\"API key has been revoked\"}")
                        .build());
                return;
            }

            if (!key.isEnabled()) {
                ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                        .entity("{\"error\":\"API key is disabled\"}")
                        .build());
                return;
            }

            // Set tenant context
            TenantContext.set(key.getTenantId());

            // Increment usage count
            incrementUsage(key.getId());

            // Set a security context so downstream can identify the caller
            ctx.setSecurityContext(new ApiKeySecurityContext(key.getTenantId(), key.getId()));

        } catch (NoResultException e) {
            ctx.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("{\"error\":\"Invalid API key\"}")
                    .build());
        } catch (Exception e) {
            LOG.errorf(e, "API key authentication error");
            ctx.abortWith(Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity("{\"error\":\"Authentication error\"}")
                    .build());
        }
    }

    @Transactional
    void incrementUsage(Long keyId) {
        try {
            em.createQuery("UPDATE ApiKeyEntity k SET k.usageCount = k.usageCount + 1 WHERE k.id = :id")
                    .setParameter("id", keyId)
                    .executeUpdate();
        } catch (Exception e) {
            LOG.warnf("Failed to increment API key usage: %s", e.getMessage());
        }
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
