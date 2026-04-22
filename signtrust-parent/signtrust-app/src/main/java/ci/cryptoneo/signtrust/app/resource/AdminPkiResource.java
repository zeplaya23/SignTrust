package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.CertificateIssueRequest;
import ci.cryptoneo.signtrust.app.dto.CertificateRevokeRequest;
import ci.cryptoneo.signtrust.app.service.AdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@RolesAllowed("SUPER_ADMIN")
@Path("/api/v1/admin")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdminPkiResource {

    @Inject
    AdminService adminService;

    @GET
    @Path("/certificates")
    public Response certificates(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("10") int size) {
        return Response.ok(adminService.getCertificates(page, size)).build();
    }

    @POST
    @Path("/certificates")
    public Response issueCertificate(CertificateIssueRequest request) {
        return Response.status(Response.Status.CREATED).entity(adminService.issueCertificate(request)).build();
    }

    @POST
    @Path("/certificates/{id}/revoke")
    public Response revokeCertificate(@PathParam("id") String id, CertificateRevokeRequest request) {
        adminService.revokeCertificate(id, request.reason());
        return Response.noContent().build();
    }

    @GET
    @Path("/hsm/slots")
    public Response hsmSlots() {
        return Response.ok(adminService.getHsmSlots()).build();
    }

    @GET
    @Path("/config/{section}")
    public Response getConfig(@PathParam("section") String section) {
        return Response.ok(adminService.getConfig(section)).build();
    }

    @PUT
    @Path("/config/{section}")
    public Response updateConfig(@PathParam("section") String section, Map<String, String> config) {
        adminService.updateConfig(section, config);
        return Response.noContent().build();
    }
}
