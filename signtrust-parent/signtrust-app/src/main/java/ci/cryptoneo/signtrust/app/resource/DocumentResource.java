package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.ApiResponse;
import ci.cryptoneo.signtrust.app.dto.DocumentDto;
import ci.cryptoneo.signtrust.app.entity.DocumentEntity;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import ci.cryptoneo.signtrust.storage.StorageService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;

@Authenticated
@Path("/api/envelopes/{envelopeId}/documents")
@Produces(MediaType.APPLICATION_JSON)
public class DocumentResource {

    @Inject
    EnvelopeServiceImpl envelopeService;

    @Inject
    StorageService storageService;

    @Inject
    SignTrustIdentity identity;

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response upload(
            @PathParam("envelopeId") Long envelopeId,
            @RestForm("file") FileUpload file,
            @RestForm("name") String name) {
        try {
            String tenantId = identity.getTenantId();
            String fileName = name != null ? name : file.fileName();
            byte[] content = Files.readAllBytes(file.filePath());
            String contentType = file.contentType();

            DocumentEntity doc = envelopeService.addDocumentFull(envelopeId, tenantId, fileName, content, contentType);
            return Response.status(Response.Status.CREATED)
                    .entity(DtoMapper.toDocumentDto(doc))
                    .build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur lecture fichier: " + e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/{docId}")
    public Response download(
            @PathParam("envelopeId") Long envelopeId,
            @PathParam("docId") Long docId) {
        String tenantId = identity.getTenantId();
        DocumentEntity doc = envelopeService.findDocument(docId, envelopeId, tenantId);
        byte[] content = storageService.download(tenantId, doc.getStorageKey());
        if (content == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiResponse.error("Document introuvable dans le stockage"))
                    .build();
        }
        return Response.ok(content)
                .header("Content-Type", doc.getContentType())
                .header("Content-Disposition", "attachment; filename=\"" + doc.getName() + "\"")
                .build();
    }

    @DELETE
    @Path("/{docId}")
    public Response delete(
            @PathParam("envelopeId") Long envelopeId,
            @PathParam("docId") Long docId) {
        String tenantId = identity.getTenantId();
        envelopeService.deleteDocument(docId, envelopeId, tenantId);
        return Response.noContent().build();
    }
}
