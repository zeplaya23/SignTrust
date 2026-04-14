package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.app.entity.ContactEntity;
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
@Path("/api/contacts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ContactResource {

    @Inject
    EntityManager em;

    @Inject
    SignTrustIdentity identity;

    @POST
    @Transactional
    public Response create(ContactCreateRequest req) {
        String tenantId = identity.getTenantId();
        ContactEntity c = new ContactEntity();
        c.setTenantId(tenantId);
        c.setName(req.name());
        c.setEmail(req.email());
        c.setPhone(req.phone());
        c.setEnvelopeCount(0);
        em.persist(c);
        return Response.status(Response.Status.CREATED)
                .entity(DtoMapper.toContactDto(c))
                .build();
    }

    @GET
    public Response list() {
        String tenantId = identity.getTenantId();
        List<ContactDto> contacts = em.createQuery(
                        "SELECT c FROM ContactEntity c WHERE c.tenantId = :tid ORDER BY c.name ASC", ContactEntity.class)
                .setParameter("tid", tenantId)
                .getResultList()
                .stream().map(DtoMapper::toContactDto).toList();
        return Response.ok(contacts).build();
    }

    @GET
    @Path("/{id}")
    public Response get(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        ContactEntity c = em.find(ContactEntity.class, id);
        if (c == null || !c.getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Contact not found", Response.Status.NOT_FOUND);
        }
        return Response.ok(DtoMapper.toContactDto(c)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, ContactCreateRequest req) {
        String tenantId = identity.getTenantId();
        ContactEntity c = em.find(ContactEntity.class, id);
        if (c == null || !c.getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Contact not found", Response.Status.NOT_FOUND);
        }
        if (req.name() != null) c.setName(req.name());
        if (req.email() != null) c.setEmail(req.email());
        if (req.phone() != null) c.setPhone(req.phone());
        em.merge(c);
        return Response.ok(DtoMapper.toContactDto(c)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        String tenantId = identity.getTenantId();
        ContactEntity c = em.find(ContactEntity.class, id);
        if (c == null || !c.getTenantId().equals(tenantId)) {
            throw new WebApplicationException("Contact not found", Response.Status.NOT_FOUND);
        }
        em.remove(c);
        return Response.noContent().build();
    }
}
