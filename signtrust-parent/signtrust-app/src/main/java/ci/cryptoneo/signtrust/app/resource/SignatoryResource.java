package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.SignatoryCreateRequest;
import ci.cryptoneo.signtrust.app.entity.SignatoryEntity;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Authenticated
@Path("/api/envelopes/{envelopeId}/signatories")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SignatoryResource {

    @Inject
    EnvelopeServiceImpl envelopeService;

    @Inject
    SignTrustIdentity identity;

    @GET
    public Response list(@PathParam("envelopeId") Long envelopeId) {
        String tenantId = identity.getTenantId();
        var signatories = envelopeService.getSignatories(envelopeId, tenantId);
        return Response.ok(signatories.stream().map(DtoMapper::toSignatoryDto).toList()).build();
    }

    @POST
    public Response add(@PathParam("envelopeId") Long envelopeId, SignatoryCreateRequest req) {
        String tenantId = identity.getTenantId();
        SignatoryEntity sig = envelopeService.addSignatoryFull(envelopeId, tenantId, req);
        return Response.status(Response.Status.CREATED)
                .entity(DtoMapper.toSignatoryDto(sig))
                .build();
    }

    @PUT
    @Path("/{sigId}")
    public Response update(
            @PathParam("envelopeId") Long envelopeId,
            @PathParam("sigId") Long sigId,
            SignatoryCreateRequest req) {
        String tenantId = identity.getTenantId();
        SignatoryEntity sig = envelopeService.updateSignatory(sigId, envelopeId, tenantId, req);
        return Response.ok(DtoMapper.toSignatoryDto(sig)).build();
    }

    @DELETE
    @Path("/{sigId}")
    public Response delete(
            @PathParam("envelopeId") Long envelopeId,
            @PathParam("sigId") Long sigId) {
        String tenantId = identity.getTenantId();
        envelopeService.deleteSignatory(sigId, envelopeId, tenantId);
        return Response.noContent().build();
    }
}
