package ci.cryptoneo.signtrust.app.resource;

import ci.cryptoneo.signtrust.app.dto.*;
import ci.cryptoneo.signtrust.iam.KeycloakAdminService;
import ci.cryptoneo.signtrust.iam.SignTrustIdentity;
import ci.cryptoneo.signtrust.notification.NotificationService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;

import java.util.Collections;
import java.util.List;

@Authenticated
@Path("/api/team")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TeamResource {

    private static final Logger LOG = Logger.getLogger(TeamResource.class);

    @Inject
    SignTrustIdentity identity;

    @Inject
    Keycloak keycloak;

    @Inject
    KeycloakAdminService keycloakAdmin;

    @Inject
    NotificationService notificationService;

    @GET
    public Response list() {
        String realmName = "signtrust";
        try {
            List<UserRepresentation> users = keycloak.realm(realmName).users().list(0, 100);
            List<TeamMemberDto> members = users.stream().map(u -> {
                // Get the first realm role that matches our known roles
                String role = "member";
                try {
                    List<RoleRepresentation> roles = keycloak.realm(realmName).users()
                            .get(u.getId()).roles().realmLevel().listEffective();
                    for (RoleRepresentation r : roles) {
                        if ("admin".equals(r.getName()) || "manager".equals(r.getName()) || "member".equals(r.getName())) {
                            role = r.getName();
                            break;
                        }
                    }
                } catch (Exception ignored) {}
                return new TeamMemberDto(u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(), role);
            }).toList();
            return Response.ok(members).build();
        } catch (Exception e) {
            LOG.errorf(e, "Failed to list team members");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur lors du chargement de l'equipe: " + e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/invite")
    public Response invite(TeamInviteRequest req) {
        try {
            String tenantId = identity.getTenantId();
            // Generate a random temporary password
            String tempPassword = java.util.UUID.randomUUID().toString().substring(0, 12);
            String userId = keycloakAdmin.createUser(tenantId != null ? tenantId : "signtrust",
                    req.email(), req.firstName(), req.lastName(), tempPassword);

            // Assign role
            if (req.role() != null) {
                try {
                    keycloakAdmin.assignRole(tenantId != null ? tenantId : "signtrust", userId, req.role());
                } catch (Exception e) {
                    LOG.warnf("Could not assign role %s to user %s: %s", req.role(), userId, e.getMessage());
                }
            }

            // Send invitation email
            String html = "<p>Bonjour " + req.firstName() + ",</p>"
                    + "<p>Vous avez ete invite a rejoindre SignTrust.</p>"
                    + "<p>Votre mot de passe temporaire: <strong>" + tempPassword + "</strong></p>"
                    + "<p>Veuillez le modifier lors de votre premiere connexion.</p>";
            notificationService.sendEmail(req.email(), "Invitation SignTrust", html);

            return Response.status(Response.Status.CREATED)
                    .entity(new TeamMemberDto(userId, req.email(), req.firstName(), req.lastName(), req.role()))
                    .build();
        } catch (Exception e) {
            LOG.errorf(e, "Failed to invite team member");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur invitation: " + e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/{userId}/role")
    public Response changeRole(@PathParam("userId") String userId, RoleUpdateRequest req) {
        try {
            String tenantId = identity.getTenantId();
            String realmName = "signtrust";

            // Remove existing SignTrust roles
            List<RoleRepresentation> currentRoles = keycloak.realm(realmName).users()
                    .get(userId).roles().realmLevel().listEffective();
            List<RoleRepresentation> toRemove = currentRoles.stream()
                    .filter(r -> "admin".equals(r.getName()) || "manager".equals(r.getName()) || "member".equals(r.getName()))
                    .toList();
            if (!toRemove.isEmpty()) {
                keycloak.realm(realmName).users().get(userId).roles().realmLevel().remove(toRemove);
            }

            // Assign new role
            keycloakAdmin.assignRole(tenantId != null ? tenantId : "signtrust", userId, req.role());

            return Response.ok(ApiResponse.ok("Role mis a jour")).build();
        } catch (Exception e) {
            LOG.errorf(e, "Failed to change role");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiResponse.error("Erreur changement de role: " + e.getMessage()))
                    .build();
        }
    }
}
