package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.NotificationEntity;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Authenticated
@Path("/api/notifications")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class NotificationResource {

    @Inject
    EntityManager em;

    @Inject
    SignTrustIdentity identity;

    @GET
    public Response list() {
        String tenantId = identity.getTenantId();
        String userId = identity.getUserId();
        List<NotificationDto> notifications = em.createQuery(
                        "SELECT n FROM NotificationEntity n WHERE n.tenantId = :tid AND n.userId = :uid ORDER BY n.createdAt DESC",
                        NotificationEntity.class)
                .setParameter("tid", tenantId)
                .setParameter("uid", userId)
                .getResultList()
                .stream().map(DtoMapper::toNotificationDto).toList();
        return Response.ok(notifications).build();
    }

    @PUT
    @Path("/{id}/read")
    @Transactional
    public Response markAsRead(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        String userId = identity.getUserId();
        NotificationEntity n = em.find(NotificationEntity.class, id);
        if (n == null || !n.getTenantId().equals(tenantId) || !n.getUserId().equals(userId)) {
            throw new WebApplicationException("Notification not found", Response.Status.NOT_FOUND);
        }
        n.setRead(true);
        em.merge(n);
        return Response.ok(ApiResponse.ok("Notification marquee comme lue")).build();
    }

    @POST
    @Path("/read-all")
    @Transactional
    public Response markAllAsRead() {
        String tenantId = identity.getTenantId();
        String userId = identity.getUserId();
        em.createQuery("UPDATE NotificationEntity n SET n.read = true WHERE n.tenantId = :tid AND n.userId = :uid AND n.read = false")
                .setParameter("tid", tenantId)
                .setParameter("uid", userId)
                .executeUpdate();
        return Response.ok(ApiResponse.ok("Toutes les notifications marquees comme lues")).build();
    }
}
