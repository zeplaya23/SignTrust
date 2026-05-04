package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.AdminTenantCreateRequest;
import ci.cryptoneo.signtrust.app.dto.EnvelopeDto;
import ci.cryptoneo.signtrust.app.entity.EnvelopeEntity;
import ci.cryptoneo.signtrust.app.entity.UserProfileEntity;
import ci.cryptoneo.signtrust.app.service.AdminService;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import ci.cryptoneo.signtrust.audit.AuditLogEntity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@RolesAllowed("SUPER_ADMIN")
@Path("/api/v1/admin/tenants")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminTenantResource {

    @Inject
    AdminService adminService;

    @Inject
    EnvelopeServiceImpl envelopeService;

    @Inject
    EntityManager em;

    @GET
    public Response list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("status") String status,
            @QueryParam("search") String search) {
        return Response.ok(adminService.getTenants(page, size, status, search)).build();
    }

    @POST
    public Response create(AdminTenantCreateRequest request) {
        return Response.status(Response.Status.CREATED).entity(adminService.createTenant(request)).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") String id) {
        var tenant = adminService.getTenant(id);
        if (tenant == null) return Response.status(Response.Status.NOT_FOUND).build();
        return Response.ok(tenant).build();
    }

    @PUT
    @Path("/{id}/suspend")
    public Response suspend(@PathParam("id") String id) {
        adminService.suspendTenant(id);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{id}/activate")
    public Response activate(@PathParam("id") String id) {
        adminService.activateTenant(id);
        return Response.noContent().build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") String id) {
        adminService.deleteTenant(id);
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/users")
    public Response users(@PathParam("id") String tenantId) {
        return Response.ok(adminService.getTenantUsers(tenantId)).build();
    }

    @GET
    @Path("/{id}/contacts")
    public Response contacts(@PathParam("id") String tenantId) {
        return Response.ok(adminService.getTenantContacts(tenantId)).build();
    }

    @GET
    @Path("/{id}/stats")
    public Response stats(@PathParam("id") String tenantId) {
        return Response.ok(adminService.getTenantStats(tenantId)).build();
    }

    @GET
    @Path("/{id}/detailed-stats")
    public Response detailedStats(@PathParam("id") String tenantId) {
        return Response.ok(adminService.getTenantDetailedStats(tenantId)).build();
    }

    @GET
    @Path("/{id}/billing")
    public Response billing(@PathParam("id") String tenantId) {
        return Response.ok(adminService.getTenantBilling(tenantId)).build();
    }

    @GET
    @Path("/{id}/envelopes")
    public Response recentEnvelopes(@PathParam("id") String tenantId) {
        return Response.ok(adminService.getTenantRecentEnvelopes(tenantId)).build();
    }

    @GET
    @Path("/{id}/audit-log")
    public Response auditLog(@PathParam("id") String tenantId) {
        return Response.ok(adminService.getTenantAuditLog(tenantId)).build();
    }

    @GET
    @Path("/{id}/envelopes/{envId}")
    public Response envelopeDetail(@PathParam("id") String tenantId, @PathParam("envId") Long envId) {
        EnvelopeEntity envelope = envelopeService.findEnvelope(envId, tenantId);
        if (envelope == null) return Response.status(Response.Status.NOT_FOUND).build();
        java.util.List<AuditLogEntity> auditLogs = envelopeService.getAuditTrail(tenantId, envId);
        EnvelopeDto dto = DtoMapper.toEnvelopeDto(envelope, auditLogs);
        // Resolve createdBy UUID to a human-readable name
        String creatorName = dto.createdBy();
        try {
            UserProfileEntity creator = em.createQuery(
                "SELECT u FROM UserProfileEntity u WHERE u.keycloakId = :kid", UserProfileEntity.class)
                .setParameter("kid", dto.createdBy()).setMaxResults(1).getSingleResult();
            String fn = creator.getFirstName() != null ? creator.getFirstName() : "";
            String ln = creator.getLastName() != null ? creator.getLastName() : "";
            creatorName = (fn + " " + ln).trim();
            if (creatorName.isEmpty()) creatorName = creator.getEmail();
        } catch (Exception ignored) {}
        // Return with resolved name
        return Response.ok(new EnvelopeDto(
            dto.id(), dto.name(), dto.status(), creatorName,
            dto.message(), dto.signingOrder(), dto.expiresAt(),
            dto.createdAt(), dto.updatedAt(), dto.documentsCount(), dto.signatoriesCount(),
            dto.documents(), dto.signatories(), dto.fields(), dto.auditTrail()
        )).build();
    }

    @DELETE
    @Path("/{id}/users/{uid}/mfa")
    public Response resetMfa(@PathParam("id") String tenantId, @PathParam("uid") String userId) {
        adminService.resetUserMfa(tenantId, userId);
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}/users/{uid}/details")
    public Response memberDetail(@PathParam("id") String tenantId, @PathParam("uid") String userId) {
        var detail = adminService.getMemberDetail(tenantId, userId);
        if (detail == null) return Response.status(Response.Status.NOT_FOUND).build();
        return Response.ok(detail).build();
    }

    @GET
    @Path("/{id}/contacts/{cid}/details")
    public Response contactDetail(@PathParam("id") String tenantId, @PathParam("cid") Long contactId) {
        var detail = adminService.getContactDetail(tenantId, contactId);
        if (detail == null) return Response.status(Response.Status.NOT_FOUND).build();
        return Response.ok(detail).build();
    }
}
