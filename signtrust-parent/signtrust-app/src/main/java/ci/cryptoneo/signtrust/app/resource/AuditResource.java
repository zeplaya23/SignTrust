package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.audit.AuditLogEntity;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Authenticated
@Path("/api/audit")
@Produces(MediaType.APPLICATION_JSON)
public class AuditResource {

    @Inject
    EntityManager em;

    @Inject
    SignTrustIdentity identity;

    @GET
    public Response list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("30") int size,
            @QueryParam("userId") String userId,
            @QueryParam("action") String action,
            @QueryParam("days") @DefaultValue("30") int days
    ) {
        String tenantId = identity.getTenantId();
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        StringBuilder jpql = new StringBuilder(
                "SELECT a FROM ci.cryptoneo.signtrust.audit.AuditLogEntity a WHERE a.tenantId = :tid AND a.createdAt >= :since");
        if (userId != null && !userId.isBlank()) {
            jpql.append(" AND a.userId = :userId");
        }
        if (action != null && !action.isBlank()) {
            jpql.append(" AND a.action = :action");
        }
        jpql.append(" ORDER BY a.createdAt DESC");

        var query = em.createQuery(jpql.toString(), AuditLogEntity.class)
                .setParameter("tid", tenantId)
                .setParameter("since", since);
        if (userId != null && !userId.isBlank()) query.setParameter("userId", userId);
        if (action != null && !action.isBlank()) query.setParameter("action", action);

        // Count total
        StringBuilder countJpql = new StringBuilder(
                "SELECT COUNT(a) FROM ci.cryptoneo.signtrust.audit.AuditLogEntity a WHERE a.tenantId = :tid AND a.createdAt >= :since");
        if (userId != null && !userId.isBlank()) countJpql.append(" AND a.userId = :userId");
        if (action != null && !action.isBlank()) countJpql.append(" AND a.action = :action");

        var countQuery = em.createQuery(countJpql.toString())
                .setParameter("tid", tenantId)
                .setParameter("since", since);
        if (userId != null && !userId.isBlank()) countQuery.setParameter("userId", userId);
        if (action != null && !action.isBlank()) countQuery.setParameter("action", action);

        long total = ((Number) countQuery.getSingleResult()).longValue();

        List<AuditLogEntity> logs = query
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();

        var items = logs.stream().map(a -> Map.of(
                "id", a.getId(),
                "userId", a.getUserId() != null ? a.getUserId() : "",
                "action", a.getAction(),
                "entityType", a.getEntityType() != null ? a.getEntityType() : "",
                "entityId", a.getEntityId() != null ? a.getEntityId() : "",
                "details", a.getDetails() != null ? a.getDetails() : "",
                "ipAddress", a.getIpAddress() != null ? a.getIpAddress() : "",
                "createdAt", a.getCreatedAt().toString()
        )).toList();

        return Response.ok(Map.of(
                "items", items,
                "total", total,
                "page", page,
                "size", size
        )).build();
    }

    @GET
    @Path("/actions")
    public Response distinctActions() {
        String tenantId = identity.getTenantId();
        @SuppressWarnings("unchecked")
        List<String> actions = em.createQuery(
                "SELECT DISTINCT a.action FROM ci.cryptoneo.signtrust.audit.AuditLogEntity a WHERE a.tenantId = :tid ORDER BY a.action"
        ).setParameter("tid", tenantId).getResultList();
        return Response.ok(actions).build();
    }
}
