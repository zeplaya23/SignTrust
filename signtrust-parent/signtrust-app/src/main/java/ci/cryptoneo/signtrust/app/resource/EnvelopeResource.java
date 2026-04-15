package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.EnvelopeEntity;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import ci.cryptoneo.signtrust.audit.AuditLogEntity;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import ci.cryptoneo.signtrust.tenant.TenantContext;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Authenticated
@Path("/api/envelopes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EnvelopeResource {

    @Inject
    EnvelopeServiceImpl envelopeService;

    @Inject
    SignTrustIdentity identity;

    @POST
    public Response create(EnvelopeCreateRequest req) {
        String tenantId = identity.getTenantId();
        TenantContext.set(tenantId);
        EnvelopeEntity envelope = envelopeService.createFull(tenantId, identity.getUserId(), req);
        return Response.status(Response.Status.CREATED)
                .entity(DtoMapper.toEnvelopeDtoLight(envelope))
                .build();
    }

    @GET
    public Response list(
            @QueryParam("status") String status,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        String tenantId = identity.getTenantId();
        String userId = identity.getUserId();
        List<EnvelopeEntity> envelopes = envelopeService.list(tenantId, userId, status, page, size);
        long total = envelopeService.count(tenantId, userId, status);
        List<EnvelopeDto> dtos = envelopes.stream().map(DtoMapper::toEnvelopeDtoLight).toList();
        return Response.ok(new PagedResponse<>(dtos, total, page, size)).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        EnvelopeEntity envelope = envelopeService.findEnvelope(id, tenantId);
        List<AuditLogEntity> auditLogs = envelopeService.getAuditTrail(tenantId, id);
        return Response.ok(DtoMapper.toEnvelopeDto(envelope, auditLogs)).build();
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, EnvelopeUpdateRequest req) {
        String tenantId = identity.getTenantId();
        EnvelopeEntity envelope = envelopeService.update(id, tenantId, req);
        return Response.ok(DtoMapper.toEnvelopeDtoLight(envelope)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        envelopeService.delete(id, tenantId);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/send")
    public Response send(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        TenantContext.set(tenantId);
        envelopeService.sendEnvelope(id, tenantId);
        return Response.ok(ApiResponse.ok("Enveloppe envoyee")).build();
    }

    @POST
    @Path("/{id}/cancel")
    public Response cancel(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        TenantContext.set(tenantId);
        envelopeService.cancelEnvelope(id, tenantId);
        return Response.ok(ApiResponse.ok("Enveloppe annulee")).build();
    }
}
