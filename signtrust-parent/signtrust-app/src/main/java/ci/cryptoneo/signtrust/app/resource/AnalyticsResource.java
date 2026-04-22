package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Authenticated
@Path("/api/analytics")
@Produces(MediaType.APPLICATION_JSON)
public class AnalyticsResource {

    @Inject
    EntityManager em;

    @Inject
    SignTrustIdentity identity;

    @GET
    @Path("/overview")
    public Response overview() {
        String tenantId = identity.getTenantId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        LocalDateTime startOfLastMonth = startOfMonth.minusMonths(1);

        long totalEnvelopes = count("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid", tenantId);
        long envThisMonth = count("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdAt >= :start", tenantId, startOfMonth);
        long envLastMonth = count("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdAt >= :start AND e.createdAt < :end", tenantId, startOfLastMonth, startOfMonth);

        long totalSignatures = count("SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid", tenantId);
        long sigThisMonth = count("SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid AND s.signedAt >= :start", tenantId, startOfMonth);
        long sigLastMonth = count("SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid AND s.signedAt >= :start AND s.signedAt < :end", tenantId, startOfLastMonth, startOfMonth);

        long pending = count("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.status = 'SENT'", tenantId);
        long completed = count("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.status = 'COMPLETED'", tenantId);
        long rejected = count("SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'REJECTED' AND s.envelope.tenantId = :tid", tenantId);

        double completionRate = totalEnvelopes > 0 ? Math.round(completed * 1000.0 / totalEnvelopes) / 10.0 : 0;
        double envGrowth = envLastMonth > 0 ? Math.round((envThisMonth - envLastMonth) * 1000.0 / envLastMonth) / 10.0 : 0;
        double sigGrowth = sigLastMonth > 0 ? Math.round((sigThisMonth - sigLastMonth) * 1000.0 / sigLastMonth) / 10.0 : 0;

        long teamSize = count("SELECT COUNT(u) FROM UserProfileEntity u WHERE u.tenantId = :tid", tenantId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalEnvelopes", totalEnvelopes);
        result.put("envelopesThisMonth", envThisMonth);
        result.put("envelopesGrowth", envGrowth);
        result.put("totalSignatures", totalSignatures);
        result.put("signaturesThisMonth", sigThisMonth);
        result.put("signaturesGrowth", sigGrowth);
        result.put("pending", pending);
        result.put("completed", completed);
        result.put("rejected", rejected);
        result.put("completionRate", completionRate);
        result.put("teamSize", teamSize);
        return Response.ok(result).build();
    }

    @GET
    @Path("/users")
    public Response perUser() {
        String tenantId = identity.getTenantId();

        @SuppressWarnings("unchecked")
        List<Object[]> users = em.createQuery(
                "SELECT u.keycloakId, u.firstName, u.lastName, u.email FROM UserProfileEntity u WHERE u.tenantId = :tid ORDER BY u.createdAt ASC"
        ).setParameter("tid", tenantId).getResultList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : users) {
            String kcId = (String) row[0];
            String firstName = row[1] != null ? (String) row[1] : "";
            String lastName = row[2] != null ? (String) row[2] : "";
            String email = (String) row[3];

            long envCreated = countByUser("SELECT COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdBy = :uid", tenantId, kcId);
            long sigDone = countByUser("SELECT COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid AND s.email = :uid", tenantId, email);

            // Last activity from audit logs
            String lastActivity = null;
            try {
                LocalDateTime last = (LocalDateTime) em.createQuery(
                        "SELECT MAX(a.createdAt) FROM ci.cryptoneo.signtrust.audit.AuditLogEntity a WHERE a.tenantId = :tid AND a.userId = :uid"
                ).setParameter("tid", tenantId).setParameter("uid", kcId).getSingleResult();
                if (last != null) lastActivity = last.toString();
            } catch (Exception ignored) {}

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", kcId != null ? kcId : "");
            m.put("firstName", firstName);
            m.put("lastName", lastName);
            m.put("email", email);
            m.put("envelopesCreated", envCreated);
            m.put("signaturesDone", sigDone);
            m.put("lastActivity", lastActivity);
            result.add(m);
        }

        return Response.ok(result).build();
    }

    @GET
    @Path("/trends")
    public Response trends(@QueryParam("days") @DefaultValue("30") int days) {
        String tenantId = identity.getTenantId();
        LocalDateTime since = LocalDateTime.now().minusDays(days).truncatedTo(ChronoUnit.DAYS);

        // Envelopes per day
        @SuppressWarnings("unchecked")
        List<Object[]> envPerDay = em.createQuery(
                "SELECT FUNCTION('DATE', e.createdAt), COUNT(e) FROM EnvelopeEntity e WHERE e.tenantId = :tid AND e.createdAt >= :since GROUP BY FUNCTION('DATE', e.createdAt) ORDER BY FUNCTION('DATE', e.createdAt)"
        ).setParameter("tid", tenantId).setParameter("since", since).getResultList();

        // Signatures per day
        @SuppressWarnings("unchecked")
        List<Object[]> sigPerDay = em.createQuery(
                "SELECT FUNCTION('DATE', s.signedAt), COUNT(s) FROM SignatoryEntity s WHERE s.status = 'SIGNED' AND s.envelope.tenantId = :tid AND s.signedAt >= :since GROUP BY FUNCTION('DATE', s.signedAt) ORDER BY FUNCTION('DATE', s.signedAt)"
        ).setParameter("tid", tenantId).setParameter("since", since).getResultList();

        List<Map<String, Object>> envTrend = envPerDay.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", r[0].toString());
            m.put("count", ((Number) r[1]).longValue());
            return m;
        }).toList();

        List<Map<String, Object>> sigTrend = sigPerDay.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date", r[0].toString());
            m.put("count", ((Number) r[1]).longValue());
            return m;
        }).toList();

        return Response.ok(Map.of("envelopes", envTrend, "signatures", sigTrend)).build();
    }

    private long count(String jpql, String tenantId) {
        return ((Number) em.createQuery(jpql).setParameter("tid", tenantId).getSingleResult()).longValue();
    }

    private long count(String jpql, String tenantId, LocalDateTime start) {
        return ((Number) em.createQuery(jpql).setParameter("tid", tenantId).setParameter("start", start).getSingleResult()).longValue();
    }

    private long count(String jpql, String tenantId, LocalDateTime start, LocalDateTime end) {
        return ((Number) em.createQuery(jpql).setParameter("tid", tenantId).setParameter("start", start).setParameter("end", end).getSingleResult()).longValue();
    }

    private long countByUser(String jpql, String tenantId, String uid) {
        if (uid == null) return 0;
        return ((Number) em.createQuery(jpql).setParameter("tid", tenantId).setParameter("uid", uid).getSingleResult()).longValue();
    }
}
