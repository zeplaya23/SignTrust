package ci.cryptoneo.signtrust.iam;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;

import io.quarkus.security.identity.SecurityIdentity;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.security.Principal;
import java.util.Collections;
import java.util.Set;

@RequestScoped
public class SignTrustIdentity {

    private static final Logger LOG = Logger.getLogger(SignTrustIdentity.class);

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    EntityManager em;

    // Cache per-request
    private String cachedTenantId;
    private String cachedAccountType;
    private boolean profileLoaded = false;

    public boolean isAnonymous() {
        return securityIdentity.isAnonymous();
    }

    public String getTenantId() {
        if (securityIdentity.isAnonymous()) return "default";

        // 1. Check JWT claim first (for per-tenant realm tokens)
        JsonWebToken jwt = getJwt();
        if (jwt != null) {
            Object tenantClaim = jwt.getClaim("tenant_id");
            if (tenantClaim != null) return tenantClaim.toString();
        }

        // 2. Lookup from DB user profile (cached per request)
        loadProfileIfNeeded();
        if (cachedTenantId != null) return cachedTenantId;

        return "default";
    }

    public String getAccountType() {
        if (securityIdentity.isAnonymous()) return null;
        loadProfileIfNeeded();
        return cachedAccountType;
    }

    private void loadProfileIfNeeded() {
        if (profileLoaded) return;
        profileLoaded = true;
        String keycloakId = getUserId();
        if (keycloakId == null) return;
        try {
            Object[] row = (Object[]) em.createNativeQuery(
                    "SELECT tenant_id, account_type FROM user_profiles WHERE keycloak_id = ?1"
            ).setParameter(1, keycloakId).getSingleResult();
            cachedTenantId = (String) row[0];
            cachedAccountType = (String) row[1];
        } catch (NoResultException ignored) {
            LOG.debugf("No user profile found for keycloakId=%s", keycloakId);
        } catch (Exception e) {
            LOG.warnf("Error loading profile for keycloakId=%s: %s", keycloakId, e.getMessage());
        }
    }

    public String getUserId() {
        if (securityIdentity.isAnonymous()) return null;
        JsonWebToken jwt = getJwt();
        return jwt != null ? jwt.getSubject() : null;
    }

    public String getEmail() {
        if (securityIdentity.isAnonymous()) return null;
        JsonWebToken jwt = getJwt();
        return jwt != null ? jwt.getClaim("email") : null;
    }

    public Set<String> getRoles() {
        if (securityIdentity.isAnonymous()) return Collections.emptySet();
        return securityIdentity.getRoles();
    }

    public boolean hasRole(String roleName) {
        if (securityIdentity.isAnonymous()) return false;
        return securityIdentity.hasRole(roleName);
    }

    private JsonWebToken getJwt() {
        Principal principal = securityIdentity.getPrincipal();
        if (principal instanceof JsonWebToken jwt) {
            return jwt;
        }
        return null;
    }
}
