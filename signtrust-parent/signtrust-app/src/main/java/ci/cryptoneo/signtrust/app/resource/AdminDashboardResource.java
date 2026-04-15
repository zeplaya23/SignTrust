package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.service.AdminService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Authenticated
@RolesAllowed("SUPER_ADMIN")
@Path("/api/v1/admin")
@Produces(MediaType.APPLICATION_JSON)
public class AdminDashboardResource {

    @Inject
    AdminService adminService;

    @GET
    @Path("/dashboard")
    public Response dashboard() {
        return Response.ok(adminService.getDashboardMetrics()).build();
    }

    @GET
    @Path("/health")
    public Response health() {
        return Response.ok(adminService.getServiceHealth()).build();
    }

    @GET
    @Path("/alerts")
    public Response alerts() {
        return Response.ok(adminService.getAlerts()).build();
    }
}
