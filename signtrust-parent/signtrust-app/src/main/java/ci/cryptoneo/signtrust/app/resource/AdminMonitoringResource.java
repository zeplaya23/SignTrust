package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.service.AdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@RolesAllowed("SUPER_ADMIN")
@Path("/api/v1/admin/monitoring")
@Produces(MediaType.APPLICATION_JSON)
public class AdminMonitoringResource {

    @Inject
    AdminService adminService;

    @GET
    @Path("/infra")
    public Response infra() {
        return Response.ok(adminService.getInfraMetrics()).build();
    }

    @GET
    @Path("/quotas")
    public Response quotas() {
        return Response.ok(adminService.getQuotaTenants()).build();
    }

    @GET
    @Path("/activity")
    public Response activity() {
        return Response.ok(adminService.getActivityCounters()).build();
    }
}
