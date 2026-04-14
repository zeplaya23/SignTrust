package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.DocumentEntity;
import ci.cryptoneo.signtrust.app.entity.EnvelopeEntity;
import ci.cryptoneo.signtrust.app.entity.SignatoryEntity;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/sign")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SignResource {

    @Inject
    EnvelopeServiceImpl envelopeService;

    @GET
    @Path("/{token}")
    public Response getSigningInfo(@PathParam("token") String token) {
        SignatoryEntity sig = envelopeService.findSignatoryByToken(token);
        EnvelopeEntity envelope = sig.getEnvelope();

        List<DocumentDto> docs = envelope.getDocuments().stream()
                .map(DtoMapper::toDocumentDto).toList();

        List<SignatureFieldDto> fields = envelope.getDocuments().stream()
                .flatMap(d -> d.getFields().stream())
                .filter(f -> f.getSignatory() != null && f.getSignatory().getId().equals(sig.getId()))
                .map(DtoMapper::toFieldDto)
                .toList();

        SigningInfoDto info = new SigningInfoDto(
                envelope.getName(),
                envelope.getMessage(),
                (sig.getFirstName() != null ? sig.getFirstName() : "") + " " + (sig.getLastName() != null ? sig.getLastName() : ""),
                sig.getEmail(),
                sig.getStatus(),
                docs,
                fields
        );
        return Response.ok(info).build();
    }

    @POST
    @Path("/{token}/sign")
    public Response sign(@PathParam("token") String token, SignRequest req) {
        envelopeService.signByToken(token, req != null ? req.signatureImageBase64() : null);
        return Response.ok(ApiResponse.ok("Document signe avec succes")).build();
    }

    @POST
    @Path("/{token}/reject")
    public Response reject(@PathParam("token") String token, RejectRequest req) {
        envelopeService.rejectByToken(token, req != null ? req.reason() : null);
        return Response.ok(ApiResponse.ok("Signature refusee")).build();
    }
}
