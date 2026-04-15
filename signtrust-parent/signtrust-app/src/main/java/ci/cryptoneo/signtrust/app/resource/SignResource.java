package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.DocumentEntity;
import ci.cryptoneo.signtrust.app.entity.EnvelopeEntity;
import ci.cryptoneo.signtrust.app.entity.SignatoryEntity;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import ci.cryptoneo.signtrust.app.service.OtpService;
import ci.cryptoneo.signtrust.storage.StorageService;
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

    @Inject
    StorageService storageService;

    @Inject
    OtpService otpService;

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

    @GET
    @Path("/{token}/documents/{docId}")
    public Response getDocument(@PathParam("token") String token, @PathParam("docId") Long docId) {
        SignatoryEntity sig = envelopeService.findSignatoryByToken(token);
        EnvelopeEntity envelope = sig.getEnvelope();
        DocumentEntity doc = envelope.getDocuments().stream()
                .filter(d -> d.getId().equals(docId))
                .findFirst()
                .orElse(null);
        if (doc == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiResponse.error("Document introuvable"))
                    .build();
        }
        byte[] content = storageService.download(envelope.getTenantId(), doc.getStorageKey());
        if (content == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiResponse.error("Document introuvable dans le stockage"))
                    .build();
        }
        return Response.ok(content)
                .header("Content-Type", doc.getContentType())
                .header("Content-Disposition", "inline; filename=\"" + doc.getName() + "\"")
                .build();
    }

    @POST
    @Path("/{token}/otp/send")
    public Response sendOtp(@PathParam("token") String token) {
        try {
            SignatoryEntity sig = envelopeService.findSignatoryByToken(token);
            otpService.generateAndSend(sig.getEmail());
            return Response.ok(ApiResponse.ok("Code OTP envoyé")).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur envoi OTP: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/{token}/otp/verify")
    public Response verifyOtp(@PathParam("token") String token, OtpVerifyRequest req) {
        SignatoryEntity sig = envelopeService.findSignatoryByToken(token);
        boolean valid = otpService.verify(sig.getEmail(), req.code());
        if (valid) {
            return Response.ok(ApiResponse.ok("Code vérifié avec succès")).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiResponse.error("Code invalide ou expiré"))
                    .build();
        }
    }

    @POST
    @Path("/{token}/reject")
    public Response reject(@PathParam("token") String token, RejectRequest req) {
        envelopeService.rejectByToken(token, req != null ? req.reason() : null);
        return Response.ok(ApiResponse.ok("Signature refusee")).build();
    }
}
