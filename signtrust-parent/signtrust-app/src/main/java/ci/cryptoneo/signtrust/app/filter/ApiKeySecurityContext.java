package ci.cryptoneo.signtrust.app.filter;

import jakarta.ws.rs.core.SecurityContext;
import java.security.Principal;

/**
 * SecurityContext for API key authenticated requests.
 * Provides a principal so @Authenticated endpoints accept the request.
 */
public class ApiKeySecurityContext implements SecurityContext {

    private final String tenantId;
    private final Long keyId;

    public ApiKeySecurityContext(String tenantId, Long keyId) {
        this.tenantId = tenantId;
        this.keyId = keyId;
    }

    @Override
    public Principal getUserPrincipal() {
        return () -> "apikey:" + keyId;
    }

    @Override
    public boolean isUserInRole(String role) {
        // API keys have basic access — not admin roles
        return "member".equals(role) || "signer".equals(role);
    }

    @Override
    public boolean isSecure() {
        return false;
    }

    @Override
    public String getAuthenticationScheme() {
        return "API_KEY";
    }

    public String getTenantId() {
        return tenantId;
    }

    public Long getKeyId() {
        return keyId;
    }
}
