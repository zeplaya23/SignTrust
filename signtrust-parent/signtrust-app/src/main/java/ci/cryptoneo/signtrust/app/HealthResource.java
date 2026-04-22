package ci.cryptoneo.signtrust.app;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.time.Instant;
import java.util.Map;

@Path("/api")
public class HealthResource {

    @GET
    @Path("/status")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> status() {
        return Map.of(
            "application", "DigiSign Parapheur",
            "version", "1.0.0-SNAPSHOT",
            "status", "UP",
            "timestamp", Instant.now().toString()
        );
    }
}
