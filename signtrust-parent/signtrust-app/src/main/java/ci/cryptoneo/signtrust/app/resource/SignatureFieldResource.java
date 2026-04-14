package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.SignatureFieldCreateRequest;
import ci.cryptoneo.signtrust.app.dto.SignatureFieldDto;
import ci.cryptoneo.signtrust.app.entity.SignatureFieldEntity;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Authenticated
@Path("/api/envelopes/{envelopeId}/fields")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SignatureFieldResource {

    @Inject
    EnvelopeServiceImpl envelopeService;

    @Inject
    SignTrustIdentity identity;

    @POST
    public Response add(@PathParam("envelopeId") Long envelopeId, SignatureFieldCreateRequest req) {
        String tenantId = identity.getTenantId();
        SignatureFieldEntity field = envelopeService.addField(envelopeId, tenantId, req);
        return Response.status(Response.Status.CREATED)
                .entity(DtoMapper.toFieldDto(field))
                .build();
    }

    @PUT
    @Path("/{fieldId}")
    public Response update(
            @PathParam("envelopeId") Long envelopeId,
            @PathParam("fieldId") Long fieldId,
            SignatureFieldCreateRequest req) {
        String tenantId = identity.getTenantId();
        SignatureFieldEntity field = envelopeService.updateField(fieldId, envelopeId, tenantId, req);
        return Response.ok(DtoMapper.toFieldDto(field)).build();
    }

    @DELETE
    @Path("/{fieldId}")
    public Response delete(
            @PathParam("envelopeId") Long envelopeId,
            @PathParam("fieldId") Long fieldId) {
        String tenantId = identity.getTenantId();
        envelopeService.deleteField(fieldId, envelopeId, tenantId);
        return Response.noContent().build();
    }

    @GET
    public Response list(@PathParam("envelopeId") Long envelopeId) {
        String tenantId = identity.getTenantId();
        List<SignatureFieldDto> fields = envelopeService.listFields(envelopeId, tenantId)
                .stream().map(DtoMapper::toFieldDto).toList();
        return Response.ok(fields).build();
    }
}
