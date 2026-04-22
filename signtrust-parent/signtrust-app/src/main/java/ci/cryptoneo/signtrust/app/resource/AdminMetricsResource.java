package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.service.AdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@RolesAllowed("SUPER_ADMIN")
@Path("/api/v1/admin/metrics")
@Produces(MediaType.APPLICATION_JSON)
public class AdminMetricsResource {

    @Inject
    AdminService adminService;

    @GET
    public Response metrics(@QueryParam("period") @DefaultValue("30d") String period) {
        return Response.ok(adminService.getGlobalMetrics(period)).build();
    }

    @GET
    @Path("/revenue")
    public Response revenue() {
        return Response.ok(adminService.getRevenueBreakdown()).build();
    }

    @GET
    @Path("/tenants")
    public Response tenants() {
        return Response.ok(adminService.getPlanDistribution()).build();
    }

    @GET
    @Path("/top")
    public Response top() {
        return Response.ok(adminService.getTopTenants()).build();
    }
}
