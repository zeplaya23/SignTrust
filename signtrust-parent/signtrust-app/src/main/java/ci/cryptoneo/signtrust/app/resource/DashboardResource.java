package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.DashboardStatsDto;
import ci.cryptoneo.signtrust.app.dto.EnvelopeDto;
import ci.cryptoneo.signtrust.app.service.DtoMapper;
import ci.cryptoneo.signtrust.app.service.EnvelopeServiceImpl;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Authenticated
@Path("/api/dashboard")
@Produces(MediaType.APPLICATION_JSON)
public class DashboardResource {

    @Inject
    EnvelopeServiceImpl envelopeService;

    @Inject
    SignTrustIdentity identity;

    @GET
    @Path("/stats")
    public Response stats() {
        String tenantId = identity.getTenantId();
        String userId = identity.getUserId();
        DashboardStatsDto stats = envelopeService.getStats(tenantId, userId);
        return Response.ok(stats).build();
    }

    @GET
    @Path("/recent")
    public Response recent() {
        String tenantId = identity.getTenantId();
        String userId = identity.getUserId();
        List<EnvelopeDto> recent = envelopeService.getRecent(tenantId, userId)
                .stream().map(DtoMapper::toEnvelopeDtoLight).toList();
        return Response.ok(recent).build();
    }
}
