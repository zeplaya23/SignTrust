package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.TemplateEntity;
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
@Path("/api/templates")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TemplateResource {

    @Inject
    EntityManager em;

    @Inject
    SignTrustIdentity identity;

    @POST
    @Transactional
    public Response create(TemplateCreateRequest req) {
        String tenantId = identity.getTenantId();
        TemplateEntity t = new TemplateEntity();
        t.setTenantId(tenantId);
        t.setName(req.name());
        t.setDescription(req.description());
        t.setDocumentsJson(req.documentsJson());
        t.setSignatoryRolesJson(req.signatoryRolesJson());
        t.setFieldsJson(req.fieldsJson());
        t.setUsageCount(0);
        em.persist(t);
        return Response.status(Response.Status.CREATED)
                .entity(DtoMapper.toTemplateDto(t))
                .build();
    }

    @GET
    public Response list() {
        String tenantId = identity.getTenantId();
        List<TemplateDto> templates = em.createQuery(
                        "SELECT t FROM TemplateEntity t WHERE t.tenantId = :tid ORDER BY t.createdAt DESC", TemplateEntity.class)
                .setParameter("tid", tenantId)
                .getResultList()
                .stream().map(DtoMapper::toTemplateDto).toList();
        return Response.ok(templates).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        TemplateEntity t = em.find(TemplateEntity.class, id);
        if (t == null || !t.getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Template not found", Response.Status.NOT_FOUND);
        }
        return Response.ok(DtoMapper.toTemplateDto(t)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, TemplateCreateRequest req) {
        String tenantId = identity.getTenantId();
        TemplateEntity t = em.find(TemplateEntity.class, id);
        if (t == null || !t.getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Template not found", Response.Status.NOT_FOUND);
        }
        if (req.name() != null) t.setName(req.name());
        if (req.description() != null) t.setDescription(req.description());
        if (req.documentsJson() != null) t.setDocumentsJson(req.documentsJson());
        if (req.signatoryRolesJson() != null) t.setSignatoryRolesJson(req.signatoryRolesJson());
        if (req.fieldsJson() != null) t.setFieldsJson(req.fieldsJson());
        em.merge(t);
        return Response.ok(DtoMapper.toTemplateDto(t)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        TemplateEntity t = em.find(TemplateEntity.class, id);
        if (t == null || !t.getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Template not found", Response.Status.NOT_FOUND);
        }
        em.remove(t);
        return Response.noContent().build();
    }
}
