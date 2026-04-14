package ci.cryptoneo.signtrust.tenant;

/**
 * ThreadLocal holder for the current tenant identifier.
 * Set by {@link TenantFilter} at the beginning of each request.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    private TenantContext() {
        // utility class
    }

    /**
     * Set the current tenant identifier.
     *
     * @param tenantId the tenant identifier
     */
    public static void set(String tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    /**
     * Get the current tenant identifier.
     *
     * @return the tenant identifier, or {@code null} if not set
     */
    public static String get() {
        return CURRENT_TENANT.get();
    }

    /**
     * Clear the current tenant identifier.
     */
    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
