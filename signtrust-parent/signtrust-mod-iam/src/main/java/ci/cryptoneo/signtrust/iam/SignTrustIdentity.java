package ci.cryptoneo.signtrust.iam;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

import io.quarkus.oidc.runtime.OidcJwtCallerPrincipal;
import io.quarkus.security.identity.SecurityIdentity;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Set;

/**
 * Request-scoped CDI bean that wraps the OIDC SecurityIdentity
 * and provides convenient access to SignTrust-specific claims.
 */
@RequestScoped
public class SignTrustIdentity {

    @Inject
    SecurityIdentity securityIdentity;

    /**
     * Returns the tenant ID extracted from the JWT "tenant_id" claim,
     * falling back to the issuer-based realm name if the custom claim is absent.
     */
    public String getTenantId() {
        JsonWebToken jwt = getJwt();
        // Try custom claim first
        Object tenantClaim = jwt.getClaim("tenant_id");
        if (tenantClaim != null) {
            return tenantClaim.toString();
        }
        // Fallback: extract from issuer URL (e.g. .../realms/signtrust-acme)
        String issuer = jwt.getIssuer();
        if (issuer != null && issuer.contains("/realms/")) {
            String realmName = issuer.substring(issuer.lastIndexOf("/realms/") + "/realms/".length());
            if (realmName.startsWith("signtrust-")) {
                return realmName.substring("signtrust-".length());
            }
            return realmName;
        }
        return null;
    }

    /**
     * Returns the subject (user ID) from the JWT token.
     */
    public String getUserId() {
        return getJwt().getSubject();
    }

    /**
     * Returns the email claim from the JWT token.
     */
    public String getEmail() {
        return getJwt().getClaim("email");
    }

    /**
     * Returns all roles assigned to the current identity.
     */
    public Set<String> getRoles() {
        return securityIdentity.getRoles();
    }

    /**
     * Checks whether the current identity has the specified role.
     */
    public boolean hasRole(String roleName) {
        return securityIdentity.hasRole(roleName);
    }

    private JsonWebToken getJwt() {
        if (securityIdentity.getPrincipal() instanceof JsonWebToken jwt) {
            return jwt;
        }
        if (securityIdentity.getPrincipal() instanceof OidcJwtCallerPrincipal oidcPrincipal) {
            return oidcPrincipal;
        }
        throw new IllegalStateException("Current principal is not a JWT token. "
                + "Ensure OIDC authentication is properly configured.");
    }
}
