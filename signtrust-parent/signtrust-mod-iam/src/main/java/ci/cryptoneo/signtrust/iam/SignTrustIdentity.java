package ci.cryptoneo.signtrust.iam;

import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

import io.quarkus.security.identity.SecurityIdentity;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.security.Principal;
import java.util.Collections;
import java.util.Set;

@RequestScoped
public class SignTrustIdentity {

    @Inject
    SecurityIdentity securityIdentity;

    public boolean isAnonymous() {
        return securityIdentity.isAnonymous();
    }

    public String getTenantId() {
        if (securityIdentity.isAnonymous()) return "default";
        JsonWebToken jwt = getJwt();
        if (jwt == null) return "default";
        Object tenantClaim = jwt.getClaim("tenant_id");
        if (tenantClaim != null) return tenantClaim.toString();
        String issuer = jwt.getIssuer();
        if (issuer != null && issuer.contains("/realms/")) {
            String realmName = issuer.substring(issuer.lastIndexOf("/realms/") + "/realms/".length());
            if (realmName.startsWith("signtrust-")) return realmName.substring("signtrust-".length());
            return realmName;
        }
        return "default";
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
