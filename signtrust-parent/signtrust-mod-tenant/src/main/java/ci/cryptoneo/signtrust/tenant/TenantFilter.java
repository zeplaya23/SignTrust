package ci.cryptoneo.signtrust.tenant;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

import java.security.Principal;

/**
 * JAX-RS filter that extracts the tenant identifier from the incoming request.
 * <p>
 * Resolution order:
 * <ol>
 *   <li>JWT claim {@code tenant_id} (via SecurityIdentity attributes)</li>
 *   <li>HTTP header {@code X-Tenant-Id} (fallback)</li>
 * </ol>
 */
@Provider
@Priority(Priorities.AUTHENTICATION + 1)
public class TenantFilter implements ContainerRequestFilter {

    @Inject
    SecurityIdentity securityIdentity;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String tenantId = null;

        // Try to extract tenant_id from security identity attributes
        if (securityIdentity != null && !securityIdentity.isAnonymous()) {
            Object claim = securityIdentity.getAttribute("tenant_id");
            if (claim != null) {
                tenantId = claim.toString();
            }
            // Fallback: try to extract realm from issuer (e.g. .../realms/signtrust-acme)
            if (tenantId == null) {
                Object issuer = securityIdentity.getAttribute("iss");
                if (issuer != null) {
                    String iss = issuer.toString();
                    if (iss.contains("/realms/")) {
                        String realmName = iss.substring(iss.lastIndexOf("/realms/") + "/realms/".length());
                        if (realmName.startsWith("signtrust-")) {
                            tenantId = realmName.substring("signtrust-".length());
                        }
                    }
                }
            }
        }

        // Fallback: check X-Tenant-Id header
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = requestContext.getHeaderString("X-Tenant-Id");
        }

        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.set(tenantId);
        } else {
            TenantContext.clear();
        }
    }
}
