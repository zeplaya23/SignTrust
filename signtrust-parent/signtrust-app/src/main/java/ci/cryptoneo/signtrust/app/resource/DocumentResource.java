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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
                .header("Content-Disposition", "inline; filename=\"" + doc.getName() + "\"")
                .build();
    }

    @GET
    @Path("/zip")
    @Produces("application/zip")
    public Response downloadZip(@PathParam("envelopeId") Long envelopeId) {
        String tenantId = identity.getTenantId();
        var envelope = envelopeService.findEnvelope(envelopeId, tenantId);
        List<DocumentEntity> docs = envelope.getDocuments();
        if (docs == null || docs.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(ApiResponse.error("Aucun document dans l'enveloppe"))
                    .build();
        }
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ZipOutputStream zos = new ZipOutputStream(baos);
            for (DocumentEntity doc : docs) {
                byte[] content = storageService.download(tenantId, doc.getStorageKey());
                if (content != null) {
                    zos.putNextEntry(new ZipEntry(doc.getName()));
                    zos.write(content);
                    zos.closeEntry();
                }
            }
            zos.close();
            String zipName = envelope.getName().replaceAll("[^a-zA-Z0-9À-ÿ\\s_-]", "") + ".zip";
            return Response.ok(baos.toByteArray())
                    .header("Content-Type", "application/zip")
                    .header("Content-Disposition", "attachment; filename=\"" + zipName + "\"")
                    .build();
        } catch (IOException e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur création ZIP: " + e.getMessage()))
                    .build();
        }
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
