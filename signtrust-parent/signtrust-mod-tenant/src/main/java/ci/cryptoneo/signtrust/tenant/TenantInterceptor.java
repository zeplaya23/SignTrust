package ci.cryptoneo.signtrust.tenant;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.interceptor.AroundInvoke;
import jakarta.interceptor.Interceptor;
import jakarta.interceptor.InvocationContext;
import jakarta.persistence.EntityManager;
import org.hibernate.Session;

import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * CDI interceptor that enables the Hibernate tenant filter on the current
 * {@link Session} before service-layer method execution.
 * <p>
 * Usage: annotate a service class or method with {@link TenantScoped}.
 *
 * <pre>
 * {@code
 * @TenantScoped
 * public class MyService {
 *     // all methods will have tenant filtering enabled
 * }
 * }
 * </pre>
 */
@Interceptor
@TenantInterceptor.TenantScoped
@Priority(Interceptor.Priority.APPLICATION)
public class TenantInterceptor {

    @Inject
    EntityManager entityManager;

    /**
     * Interceptor binding annotation for tenant-scoped service methods.
     */
    @jakarta.interceptor.InterceptorBinding
    @Inherited
    @Target({ElementType.TYPE, ElementType.METHOD})
    @Retention(RetentionPolicy.RUNTIME)
    public @interface TenantScoped {
    }

    @AroundInvoke
    public Object enableTenantFilter(InvocationContext context) throws Exception {
        String tenantId = TenantContext.get();
        if (tenantId != null) {
            entityManager.unwrap(Session.class)
                    .enableFilter("tenantFilter")
                    .setParameter("tenantId", tenantId);
        }
        return context.proceed();
    }
}
